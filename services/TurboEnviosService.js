const axios = require("axios");
const config = require("../config/config");
const Service = require("./Services");

class TurboEnvios {
  constructor() {
    this.apiUrl = config.turboEnvios.TURBOENVIOS_URL_QUOTE;
    this.labelUrl = config.turboEnvios.TURBOENVIOS_URL_LABEL;
    this.token = config.turboEnvios.TURBOENVIOS_TOKEN;
  }

  async getQuote(data) {
    try {
      const structuredData = await this.buildQuoteRequestBody(data);
      const response = await axios.post(this.apiUrl, structuredData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      });
      const reposeMapped = await this.mapShippingResponse(response.data);

        return reposeMapped;
    } catch (error) {
      console.error(
        "Error fetching quote:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  async buildQuoteRequestBody(shipmentDetails) {
    if (
      !shipmentDetails ||
      !shipmentDetails.cp_origen ||
      !shipmentDetails.cp_destino
    ) {
      throw new Error("Campos 'cp_origen' y 'cp_destino' son requeridos");
    }

    return {
      origin: shipmentDetails.cp_origen,
      destination: shipmentDetails.cp_destino,
      weight: shipmentDetails.peso || 1,
      length: shipmentDetails.largo || 1,
      width: shipmentDetails.ancho || 1,
      height: shipmentDetails.alto || 1,
      insurePackage: shipmentDetails.seguro > 0 ? true : false,
      packageValue: shipmentDetails.valor_declarado || 0,
    };
  }


  async mapShippingResponse  (shippingResponse){
    if (!shippingResponse || !Array.isArray(shippingResponse.quotations)) {
      console.log('La respuesta de cotización no tiene la estructura esperada:', JSON.stringify(shippingResponse));
      return { paqueterias: [] };
    }
  
    const paqueterias = shippingResponse.quotations.map(quotation => {
      const precio = quotation.costCents ? quotation.costCents / 100 : 0;
  
      return {
        idServicio: quotation.quotationId || 'N/A',
        logo: "https://superenvios.mx/api/images/servicios/placeholder_logo.png",
        proveedor: quotation.provider || 'Proveedor desconocido',
        nombre_servicio: quotation.service || 'Servicio desconocido',
        tiempo_de_entrega: quotation.description || 'Consultar tiempo de entrega',
        precio_regular: precio.toFixed(2),
        precio: precio.toFixed(2),
        zona_extendida: quotation.isExtendedZone ? "TRUE" : "FALSE",
        precio_zona_extendida: "0.00",
        precio_seguro: "No", // No viene información de seguro en esta respuesta
        fecha_claro_entrega: 'Fecha no disponible', // No viene fecha en esta respuesta
        fecha_mensajeria_entrega: 'Fecha no disponible',
        peso: 0, // No viene peso
        peso_volumetrico: 0, // No viene peso volumétrico
        dimensiones: 'No especificado',
        status: true,
        token: 'N/A', // No viene token
      };
    });
  
    return { paqueterias };
  };
  
  
}

module.exports = new TurboEnvios();
