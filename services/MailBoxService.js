const config = require("../config/config");
const Service = require("../models/ServicesModel");

class MailBoxService {
  constructor() {
    this.apiToken = config.MAILBOXES.MAILBOX_API_TOKEN;
    this.apiUrl = config.MAILBOXES.MAILBOX_API_URL;
  }

async getQuote(data) {
  if (!data?.cp_origen || !data?.cp_destino) {
    throw new Error("Datos incompletos para cotización");
  }

  try {
    const requestBody = await this.buildQuoteRequestBody(data);
    const params = new URLSearchParams(requestBody);

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

      const rawResponse = await response.json();

      console.log("Respuesta cruda de cotización MailBox:", JSON.stringify(rawResponse, null, 2));

      const mappedResponse = this.mapMailBoxQuote(rawResponse);

      console.log("Respuesta mapeada de cotización MailBox:", mappedResponse);
      const finalResponse = await this.applyPercentagesToQuote(mappedResponse);
      console.log("Respuesta final de cotización MailBox:", finalResponse);
      // console.log("Respuesta MailBox con porcentajes:", finalResponse);
      return finalResponse;
    } catch (error) {
      console.error("Error en MailBoxService:", error);
      throw "Error al obtener cotización de MailBox: " + error.message;
    }
  }

  async buildQuoteRequestBody(data) {
    return {
      token: this.apiToken,
      action: "quoteshipment",
      origin_city: data.ciudad_origen,
      origin_state: data.estado_origen,
      origin_cp: data.cp_origen,
      recipient_city: data.ciudad_destino,
      recipient_state: data.estado_destino,
      recipient_cp: data.cp_destino,
      recipient_country: data.pais_destino ?? "MX",
      package_weight: data.peso,
      package_length: data.largo,
      package_width: data.ancho,
      package_height: data.alto,
      order_total: data.valor_declarado ?? 0,
    };
  }

  mapMailBoxQuote(mailboxResponse) {
    if (!mailboxResponse || !Array.isArray(mailboxResponse.rates)) {
      return { paqueterias: [] };
    }

    const getCarrier = (serviceName = "") => {
      const name = serviceName.trim().toUpperCase();
      if (name.includes("FEDEX")) return "FEDEX";
      if (name.includes("ESTAFETA")) return "ESTAFETA";
      if (name.includes("DHL")) return "DHL";
      if (name.includes("PAQUETEXPRESS")) return "PAQUETEXPRESS";
      return "DESCONOCIDO";
    };

    const paqueterias = mailboxResponse.rates
      .filter((rate) => rate.service_name) // <-- Ignorar los que no tienen servicio
      .map((rate) => {
        const total = Number(rate.total ?? 0);
        const carrier = getCarrier(rate.service_name);

        return {
          idServicio: rate.shipping_service || rate.serviceId || "N/A",
          proveedor: carrier,
          nombre_servicio: rate.service_name.trim(),
          tiempo_de_entrega: rate.delivery_date || "Sin información",
          precio_regular: total.toFixed(2),
          precio: total.toFixed(2),
          zona_extendida: "FALSE",
          precio_zona_extendida: "0.00",
          precio_seguro: "No",
          fecha_claro_entrega: rate.delivery_date || "Fecha no disponible",
          fecha_mensajeria_entrega: rate.delivery_date || "Fecha no disponible",
          peso: 0,
          peso_volumetrico: 0,
          dimensiones: "No especificado",
          status: true,
          token: "N/A",
        };
      });

    return { paqueterias };
  }

  async applyPercentagesToQuote(quoteResponse) {
    const mailboxService = await Service.findOne({ name: "mailbox" });

    if (!mailboxService) return quoteResponse;

    quoteResponse.paqueterias = quoteResponse.paqueterias
      .map((quote) => {
        const provider = mailboxService.providers.find(
          (p) => p.name === quote.proveedor
        );
        if (!provider) return null;

        const service = provider.services.find(
          (s) => s.idServicio === quote.idServicio
        );
        if (!service) return null;

        const precio_api = parseFloat(quote.precio_regular);
        let precio_guia = precio_api / 0.95;
        let precio_venta = precio_guia / (1 - service.percentage / 100);

        const utilidad = precio_venta - precio_guia;
        const utilidad_dagpacket = utilidad * 0.3;
        const precio_guia_lic = precio_guia + utilidad_dagpacket;

        const iva_precio_venta = precio_venta * 0.16;
        const iva_precio_regular = precio_guia_lic * 0.16;
        const iva_precio_guia = precio_guia * 0.16;
        const iva_precio_api = precio_api * 0.16;

        return {
          ...quote,
          status: service.status,
          servicio: "MailBox",
          precio: (precio_venta + iva_precio_venta).toFixed(2),
          precio_regular: (precio_guia_lic + iva_precio_regular).toFixed(2),
          precio_guia: (precio_guia + iva_precio_guia).toFixed(2),
          precio_api: (precio_api + iva_precio_api).toFixed(2),
        };
      })
      .filter((q) => q !== null);

    return quoteResponse;
  }

  async buildMailBoxShipmentBody(shipmentData) {
    const { from, to, package: pkg } = shipmentData;

    const serviceId = Number(pkg.service_id);
    let labelSize = "PAPER_4X6";
    const estafetaServices = [205217, 205298];
    const isEstafeta = estafetaServices.includes(serviceId);

    if (serviceId === 205218) labelSize = "6X4_thermal"; // DHL
    else labelSize = "PAPER_4X6";

    const declaredValue = Number(pkg.declared_value) || 0;
    const hasInsurance = pkg.insurance === 1 || pkg.insurance === true;

    // Si tiene seguro activo y el valor declarado > 1000, usarlo
    const insuranceValue =
      hasInsurance && declaredValue > 1000 ? declaredValue : 0;

    const body = {
      token: this.apiToken,
      action: "newshipment",
      shipping_service: pkg.service_id,
      label: 1,
      order_number: `order_${Date.now()}`,
      order_total: insuranceValue,
      order_currency: "MN",

      // Remitente
      origin_name: from.name,
      origin_add1: `${from.street} ${from.external_number}`,
      origin_add2: from.settlement,
      origin_city: from.city,
      origin_state: from.state,
      origin_cp: from.zip_code,
      origin_country: "MX",
      origin_phone: from.phone,
      origin_email: from.email,

      // Destinatario
      recipient_name: to.name,
      recipient_add1: `${to.street} ${to.external_number}`,
      recipient_add2: to.settlement,
      recipient_city: to.city,
      recipient_state: to.state,
      recipient_cp: to.zip_code,
      recipient_country: "MX",
      recipient_phone: to.phone,
      recipient_email: to.email,

      // Paquete
      package_weight: pkg.weight,
      package_weight_unit: "K",
      package_length: pkg.length,
      package_width: pkg.width,
      package_height: pkg.height,
      package_dim_unit: "cm",
      package_contents: pkg.detailed_content,
    };

    if (!isEstafeta) {
      body.label_format = "PDF";
      body.label_size = labelSize;
    }

    console.log("Seguro aplicado:", insuranceValue);
    return body;
  }

  async generateGuide(shipmentData) {
    const body = await this.buildMailBoxShipmentBody(shipmentData);
    console.log("Cuerpo de la solicitud MailBox:", body);
    const params = new URLSearchParams(body);

    // console.log("Parámetros de la solicitud MailBox:", params.toString());
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });

    const result = await response.json();
    console.log("Respuesta de generación de guía MailBox:", result);
    return result;
  }
}

module.exports = new MailBoxService();
