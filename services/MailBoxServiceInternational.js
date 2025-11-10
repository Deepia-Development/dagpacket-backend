const config = require("../config/config");
const Service = require("../models/ServicesModel");
const UserModel = require("../models/UsersModel");

class MailBoxServiceInternational {
  constructor() {
    this.apiToken = config.MAILBOXES.MAILBOX_API_TOKEN;
    this.apiUrl = config.MAILBOXES.MAILBOX_API_URL;
  }

async getQuote(data) {
  if (!data?.isInternational) {
    console.log("🌐 Envío nacional detectado — no se ejecuta MailBox internacional.");
    return null;
  }

  if (!data?.cp_origen || !data?.cp_destino) {
    throw new Error("Datos incompletos para cotización");
  }

  try {
    const requestBody = await this.buildQuoteRequestBody(data);
    console.log("📦 Cuerpo de la solicitud de cotización MailBox Internacional:", requestBody);
    const params = new URLSearchParams(requestBody);

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });

    const rawText = await response.text();
    console.log("📦 Respuesta cruda de MailBox Internacional:", rawText);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${rawText}`);
    }

    // Intentar parsear la respuesta JSON
    let rawResponse;
    try {
      rawResponse = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ No se pudo parsear la respuesta JSON:", e);
      throw new Error("Respuesta inválida del servidor MailBox Internacional");
    }

    // Procesar respuesta y aplicar porcentajes
    const mappedResponse = this.mapMailBoxQuote(rawResponse);
    const finalResponse = await this.applyPercentagesToQuote(mappedResponse);

    return finalResponse;

  } catch (error) {
    console.error("Error en MailBoxService:", error);
    throw new Error("Error al obtener cotización de MailBox: " + (error?.message || error));
  }
}
mapMailBoxQuote(mailboxResponse, data = {}) {
  const USD_TO_MXN = 20; // Tipo de cambio fijo

  if (!mailboxResponse || !Array.isArray(mailboxResponse.rates)) {
    console.warn("⚠️ No se encontraron cotizaciones válidas en MailBox Internacional.");
    return { paqueterias: [] };
  }

  const getCarrier = (serviceName = "", courier = "") => {
    const name = (serviceName || courier || "").trim().toUpperCase();
    if (name.includes("FEDEX")) return "FEDEX";
    if (name.includes("DHL")) return "DHL";
    if (name.includes("UPS")) return "UPS";
    if (name.includes("ESTAFETA")) return "ESTAFETA";
    if (name.includes("PAQUETEXPRESS")) return "PAQUETEXPRESS";
    return "DESCONOCIDO";
  };

  const paqueterias = mailboxResponse.rates
    .filter(rate => rate && !rate.error && (rate.service_name || rate.service))
    .map(rate => {
      const totalUSD = Number(rate.total ?? rate.total_with_iva ?? 0);
      const insuranceUSD = Number(
        rate.charges?.find(c => c.charge === "insurance")?.amount ?? 0
      );
      const carrier = getCarrier(rate.service_name, rate.courier);

      // Conversión a pesos mexicanos
      const totalMXN = totalUSD * USD_TO_MXN;
      const insuranceMXN = insuranceUSD * USD_TO_MXN;

      return {
        idServicio: rate.service_id || rate.shipping_service || "N/A",
        proveedor: carrier,
        nombre_servicio: rate.service_name?.trim() || rate.service || "Servicio desconocido",
        moneda: "MXN",
        tiempo_de_entrega: rate.delivery_date || "Sin información",
        precio_regular: totalMXN.toFixed(2),
        precio: totalMXN.toFixed(2),
        zona_extendida: "FALSE",
        precio_zona_extendida: "0.00",
        precio_seguro: insuranceMXN.toFixed(2),
        fecha_claro_entrega: rate.delivery_date || "Fecha no disponible",
        fecha_mensajeria_entrega: rate.delivery_date || "Fecha no disponible",
        peso: data?.peso || 0,
        peso_volumetrico: data?.peso_volumetrico || 0,
        dimensiones: data?.dimensiones || "No especificado",
        status: true,
        token: "N/A",
      };
    })
    .filter(q => q.precio > 0); // Evita cotizaciones vacías

  console.log("✅ Cotizaciones mapeadas correctamente:", paqueterias.length);
  return { paqueterias };
}





async applyPercentagesToQuote(quoteResponse) {
  const mailboxService = await Service.findOne({ name: "mailbox" });

  // Si no hay configuración, devolvemos los precios originales
  if (!mailboxService) {
    console.warn("⚠️ No se encontraron porcentajes configurados para MailBox.");
    return {
      ...quoteResponse,
      paqueterias: quoteResponse.paqueterias.map(q => ({
        ...q,
        servicio: "MailBox",
        precio_guia: q.precio_regular,
        precio_api: q.precio_regular,
        precio_regular: q.precio_regular,
      })),
    };
  }

  const result = quoteResponse.paqueterias
    .map(quote => {
      const provider = mailboxService.providers.find(
        p => p.name === quote.proveedor
      );
      if (!provider) {
        console.warn(`Proveedor no encontrado: ${quote.proveedor}`);
        return { ...quote, servicio: "MailBox", precio: quote.precio_regular };
      }

      const service = provider.services.find(
        s => String(s.idServicio) === String(quote.idServicio)
      );

      if (!service) {
        console.warn(`Servicio no encontrado para ${quote.idServicio} en ${quote.proveedor}`);
        return { ...quote, servicio: "MailBox", precio: quote.precio_regular };
      }

      // Si está desactivado, no lo incluimos
      if (service.status === false) {
        console.log(`⚠️ Servicio ${quote.nombre_servicio} inactivo`);
     
      }

      const precio_api = parseFloat(quote.precio_regular);
      const precio_guia = precio_api / 0.95;
      const precio_venta = precio_guia / (1 - service.percentage / 100);
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

  console.log(`✅ Cotizaciones con porcentaje aplicado: ${result.length}`);
  return { ...quoteResponse, paqueterias: result };
}






async buildQuoteRequestBody(data) {
  return {
    token: this.apiToken,
    action: "quote_international_shipment",

    // --- Origen ---
    origin_country: data.pais_origen || "MX",
    origin_cp: data.cp_origen,
    origin_city: data.ciudadOrigen || data.ciudad_origen,
    origin_state: data.ciudad_destino || data.estado_origen,

    // --- Destino ---
    recipient_country: data.pais_destino || "US",
    recipient_cp: data.cp_destino,
    recipient_city: data.ciudad_destino,
    recipient_state: data.recipient_state_iso || data.estado_destino,

    // --- Tipo de envío ---
    shipping_type:
      data.shippingType?.toLowerCase() === "sobre" ? "envelope" : "package",

    // --- Medidas y peso ---
    package_weight: parseFloat(data.peso) || 1,
    package_length: parseInt(data.largo) || 25,
    package_width: parseInt(data.ancho) || 25,
    package_height: parseInt(data.alto) || 10,

    // --- Valor declarado ---
    order_total: parseFloat(data.valor_declarado) || 0,
  };
}



async buildMailBoxShipmentBody(shipmentData) {
  const { from, to, package: pkg, items = [] } = shipmentData;

  const user = await UserModel.findById(shipmentData.user_id).lean();
  const originCompany = (user && user.enterprise) ? user.enterprise : "Dagpacket";

  const body = {
    token: this.apiToken,
    action: "new_international_shipment",
    service_id: Number(pkg.service_id),

    // === ORIGEN ===
    origin_country: "MX",
    origin_postalcode: from.zip_code,
    origin_city: from.city,
    origin_name: from.name,
    origin_email: from.email,
    origin_phone: from.phone,
    origin_address: `${from.street} ${from.external_number}`,
    origin_address_two: from.settlement || "",
    origin_address_three: from.reference || "",
    origin_state: from.iso_estado,
    origin_company: originCompany, // ✅ aquí siempre habrá un valor

    // === DESTINO ===
    receiver_country: to.iso_pais,
    receiver_postalcode: to.zip_code,
    receiver_city: to.city,
    receiver_name: to.name,
    receiver_email: to.email,
    receiver_phone: to.phone,
    receiver_address: `${to.street} ${to.external_number}`,
    receiver_address_two: to.settlement || "",
    receiver_address_three: to.reference || "",
    receiver_state: to.iso_estado,

    // === CONFIGURACIÓN ===
    unit_system: "INT",
    currency: "MXN",

    // === CONTENIDO ===
    shipping_content: pkg.detailed_content || "Documentos",
    shipping_purpose: shipmentData.purpose || "Venta",
    shipping_reference: shipmentData.carta_porte || "",
    shipping_type: shipmentData.shipping_type === "sobre" ? "envelope" : "package",
    shipping_charges_payment: "receiver",
    receiver_company:"",
    
    // === FORMATO DE ETIQUETA ===
    shipping_label_format: "pdf",
    shipping_label_size: "letter",
    shipping_invoice_letter: "yes",

    // === TOTALES ===
    shipping_amount: shipmentData.price || 0,
    shipping_order: `ORD-${Date.now()}`,
    shipping_number: 1,

    // === DETALLE DE PAQUETES ===
    packages: JSON.stringify([
      {
        weight: pkg.weight,
        width: pkg.width,
        height: pkg.height,
        length: pkg.length,
        items: items.map((item) => ({
          description: item.descripcion_producto || pkg.detailed_content,
          quantity: Number(item.cantidad_producto || 1),
          measure: "BOX",
          material: "General",
          amount: Number(item.valor_producto || pkg.declared_value),
          origin_country: "México",
        })),
      },
    ]),

    // === OPCIONALES (solo UPS) ===
    paperless: JSON.stringify([
      { name: "invoice.pdf", file: "fileDataBase64", type: "002" },
    ]),

    shipping_protection_value: pkg.insurance ? pkg.declared_value : 0,
  };

  return body;
}




  async generateGuide(shipmentData) {
    const body = await this.buildMailBoxShipmentBody(shipmentData);
    console.log("Cuerpo de la solicitud MailBox:", JSON.stringify(body, null, 2));
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

module.exports = new MailBoxServiceInternational();
