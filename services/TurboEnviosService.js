const axios = require("axios");
const config = require("../config/config");
const Service = require("../models/ServicesModel");

class TurboEnvios {
  constructor() {
    this.apiUrl = config.turboEnvios.TURBOENVIOS_URL_QUOTE;
    this.labelUrl = config.turboEnvios.TURBOENVIOS_URL_LABEL;
    this.token = config.turboEnvios.TURBOENVIOS_TOKEN;
  }

  async getQuote(data) {
    try {
      if (!quoteData || !quoteData.cp_origen || !quoteData.cp_destino) {
        throw new Error("Datos de envío incompletos");
      }

      if (quoteData.isInternational) {
        throw new Error("No se permiten envíos internacionales");
      }
      const structuredData = await this.buildQuoteRequestBody(data);
      const response = await axios.post(this.apiUrl, structuredData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log("Response from TurboEnvios:", response.data);
      const reposeMapped = await this.mapShippingResponse(response.data);
      console.log("Response mapped:", reposeMapped);
      const modifiedResponse = await this.applyPercentagesToQuote(reposeMapped);
      console.log("Cotizaciones modificadas:", modifiedResponse);

      return modifiedResponse;
    } catch (error) {
      console.error(
        "Error fetching quote:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  async generateGuide(shipmentData) {
    try {
      const requestBody = await this.buildGuideRequestBody(shipmentData);
      const response = await axios.post(this.labelUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log("Response from TurboEnvios:", response.data);

      return response.data;
    } catch (error) {
      console.error(
        "Error al generar guía:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  async applyPercentagesToQuote(quoteResponse) {
    const turboEnviosService = await Service.findOne({ name: "TurboEnvios" });

    if (!turboEnviosService) {
      console.warn("No se encontraron porcentajes para TurboEnvios");
      return quoteResponse;
    }

    // console.log("Porcentajes TurboEnvios:", turboEnviosService.providers);
    // console.log('quoteResponse:', quoteResponse.paqueterias);

    if (quoteResponse.paqueterias && Array.isArray(quoteResponse.paqueterias)) {
      quoteResponse.paqueterias = quoteResponse.paqueterias
        .map((quote) => {
          console.log("provider quote:", turboEnviosService);
          console.log("Proveedor turbo:", quote.proveedor);
          let provider;
          if (turboEnviosService?.providers) {
            provider = turboEnviosService.providers.find(
              (p) => p.name === quote.proveedor
            );
            console.log("provider:", provider);
          }

          if (!provider) {
            console.warn(
              `No se encontraron porcentajes para el proveedor ${quote.proveedor}`
            );
            return null;
          }

          const service = provider.services.find(
            (s) => s.idServicio === quote.idServicio
          );

          if (!service) {
            console.warn(
              `No se encontraron porcentajes para el servicio ${quote.idServicio}`
            );
            return null;
          }

          const precio = parseFloat(quote.precio_regular);
          let precio_guia = precio / 0.95;
          let precio_venta = precio_guia / (1 - service.percentage / 100);
          const utilidad = precio_venta - precio_guia;
          const utilidad_dagpacket = utilidad * 0.3;
          const precio_guia_lic = precio_guia + utilidad_dagpacket;

          console.log("Precio Api:", precio);
          console.log("Precio Guía:", precio_guia);
          console.log("Precio Guía Lic:", precio_guia_lic);
          console.log("Precio Venta:", precio_venta);
          console.log("Utilidad:", utilidad);
          console.log("Utilidad Dagpacket:", utilidad_dagpacket);

          return {
            ...quote,
            status: service.status,
            servicio: "TurboEnvios",
            precio: precio_venta.toFixed(2),
            precio_regular: precio_guia_lic.toFixed(2),
            precio_guia: precio_guia.toFixed(2),
            precio_api: precio.toFixed(2),
          };
        })
        .filter((quote) => quote !== null);

      // Si después del filtrado no hay paqueterías, devolver un objeto vacío o null
      if (
        !quoteResponse.paqueterias ||
        quoteResponse.paqueterias.length === 0
      ) {
        console.log("No se encontraron servicios activos después del filtrado");
        return {
          ...quoteResponse,
          paqueterias: [],
        };
      }
    }
    return quoteResponse;
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

  async mapShippingResponse(shippingResponse) {
    if (!shippingResponse || !Array.isArray(shippingResponse.quotations)) {
      console.log(
        "La respuesta de cotización no tiene la estructura esperada:",
        JSON.stringify(shippingResponse)
      );
      return { paqueterias: [] };
    }

    const paqueterias = shippingResponse.quotations.map((quotation) => {
      const precio = quotation.costCents ? quotation.costCents / 100 : 0;

      return {
        idServicio: quotation.code || "N/A",
        logo: "https://superenvios.mx/api/images/servicios/placeholder_logo.png",
        proveedor: quotation.provider || "Proveedor desconocido",
        nombre_servicio: quotation.service || "Servicio desconocido",
        tiempo_de_entrega:
          quotation.description || "Consultar tiempo de entrega",
        precio_regular: precio.toFixed(2),
        precio: precio.toFixed(2),
        zona_extendida: quotation.isExtendedZone ? "TRUE" : "FALSE",
        precio_zona_extendida: "0.00",
        precio_seguro: "No", // No viene información de seguro en esta respuesta
        fecha_claro_entrega: "Fecha no disponible", // No viene fecha en esta respuesta
        fecha_mensajeria_entrega: "Fecha no disponible",
        peso: 0, // No viene peso
        peso_volumetrico: 0, // No viene peso volumétrico
        dimensiones: "No especificado",
        status: true,
        token: quotation.quotationId, // No viene token
        token_turbo: quotation.quotationId, // No viene token turbo
      };
    });

    return { paqueterias };
  }

  async buildGuideRequestBody(shipmentDetails) {
    console.log("buildGuideRequestBody shipmentDetails:", shipmentDetails);

    return {
      quotationId: shipmentDetails.token,
      sender: {
        name: shipmentDetails.from.name,
        phone: shipmentDetails.from.phone,
        email: shipmentDetails.from.email,
        businessName: "Dagpacket",
        country: shipmentDetails.from.iso_pais,
        state: shipmentDetails.from.state,
        city: shipmentDetails.from.city,
        neighborhood: shipmentDetails.from.settlement,
        street: shipmentDetails.from.street,
        number: shipmentDetails.from.external_number,
        references: shipmentDetails.from.references,
      },
      recipient: {
        name: shipmentDetails.to.name,
        phone: shipmentDetails.to.phone,
        email: shipmentDetails.to.email,
        businessName: "Dagpacket",
        country: shipmentDetails.to.iso_pais,
        state: shipmentDetails.to.state,
        city: shipmentDetails.to.city,
        neighborhood: shipmentDetails.to.settlement,
        street: shipmentDetails.to.street,
        number: shipmentDetails.to.external_number,
        references: shipmentDetails.to.references,
      },
      package: {
        description: shipmentDetails.package.content,
        satCategory: "43211600",
        type: shipmentDetails.type === "Sobre" ? "envelope" : "box",
      },
    };
  }
}

module.exports = new TurboEnvios();
