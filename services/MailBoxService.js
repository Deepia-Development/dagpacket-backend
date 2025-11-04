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
    const mappedResponse = this.mapMailBoxQuote(rawResponse);
    const finalResponse = await this.applyPercentagesToQuote(mappedResponse);

    return finalResponse;

  } catch (error) {
    console.error("Error en MailBoxService:", error);
    throw new Error("Error al obtener cotización de MailBox: " + (error?.message || error));
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

    const getCarrier = (serviceName) => {
      const name = serviceName.trim().toUpperCase();
      if (name.includes("FEDEX")) return "FEDEX";
      if (name.includes("ESTAFETA")) return "ESTAFETA";
      if (name.includes("DHL")) return "DHL";
      if (name.includes("PAQUETEXPRESS")) return "PAQUETEXPRESS";
      return "DESCONOCIDO";
    };

    const paqueterias = mailboxResponse.rates.map(rate => {
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

        return {
          ...quote,
          status: service.status,
          servicio: "MailBox",
          precio: precio_venta.toFixed(2),
          precio_regular: precio_guia_lic.toFixed(2),
          precio_guia: precio_guia.toFixed(2),
          precio_api: precio_api.toFixed(2),
        };
      })
      .filter(q => q !== null);

    return quoteResponse;
  }

async buildMailBoxShipmentBody(shipmentData) {
  const { from, to, package: pkg } = shipmentData;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  const serviceId = Number(pkg.service_id);
  let labelSize = "PAPER_4X6"; // valor por defecto

  switch (serviceId) {
    // --- FEDEX ECONÓMICO ---
    case 205214:
      labelSize = "PAPER_4X6";
      break;

    // --- ESTAFETA TERRESTRE ---
    case 205217:
      labelSize = "PAPER_4X6";
      break;

    // --- DHL DOMÉSTICO EXPRESS ---
    case 205218:
      labelSize = "6X4_thermal"; // ✅ formato 6x4 para DHL
      break;

    // --- PAQUETEXPRESS ---
    case 205219:
      labelSize = "PAPER_4X6";
      break;

    default:
      labelSize = "PAPER_4X6";
      break;
  }

  return {
    token: this.apiToken,
    action: "newshipment",

    shipping_service: pkg.service_id,
    label: 1,

    order_number: `order_${Date.now()}`,
    order_total: pkg.declared_value ?? 0,
    order_currency: "MN",

    // REMITENTE
    origin_name: from.name,
    origin_add1: `${from.street} ${from.external_number}`,
    origin_add2: from.settlement,
    origin_city: from.city,
    origin_state: from.state,
    origin_cp: from.zip_code,
    origin_country: "MX",
    origin_phone: from.phone,
    origin_email: from.email,

    // DESTINATARIO
    recipient_name: to.name,
    recipient_add1: `${to.street} ${to.external_number}`,
    recipient_add2: to.settlement,
    recipient_city: to.city,
    recipient_state: to.state,
    recipient_cp: to.zip_code,
    recipient_country: "MX",
    recipient_phone: to.phone,
    recipient_email: to.email,

    // PAQUETE
    package_weight: pkg.weight,
    package_weight_unit: "K",
    package_length: pkg.length,
    package_width: pkg.width,
    package_height: pkg.height,
    package_dim_unit: "cm",
    package_contents: pkg.detailed_content,
    // label_format: "PDF",
    // label_size: labelSize,
  };
}


  async generateGuide(shipmentData) {
    const body = await this.buildMailBoxShipmentBody(shipmentData);
    console.log("Cuerpo de la solicitud MailBox:", body);
    const params = new URLSearchParams(body);

    // console.log("Parámetros de la solicitud MailBox:", params.toString());
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: params.toString()
    });

    const result = await response.json();
    console.log("Respuesta de generación de guía MailBox:", result);
    return result;
  }
}

module.exports = new MailBoxService();
