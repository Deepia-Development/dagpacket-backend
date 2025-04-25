const axios = require("axios");
const config = require("../config/config");
const moment = require("moment");
const {
  mapDHLResponse,
  mapToDHLShipmentFormat,
  mapDHLTrackingResponse
  
} = require("../utils/dhlMapper");
const Service = require("../models/ServicesModel");

class DHLService {
  constructor() {
    this.apiBase = config.dhl.apiBase;
    this.token = config.dhl.token;
    this.account = config.dhl.account;
    this.user = config.dhl.user;
    this.password = config.dhl.password;
  }

  async trackGuide(trackingNumber, dateFrom, dateTo) {
    try {
      console.log('Iniciando rastreo de guía con DHL:', trackingNumber);
      
      const response = await axios.get('https://express.api.dhl.com/mydhlapi/tracking', {
        params: {
          shipmentTrackingNumber: trackingNumber.toString(),
          pieceTrackingNumber: '', // Optional, can be left empty
          shipperAccountNumber: '984637940', // Your account number
          dateRangeFrom:  moment(dateFrom).format('YYYY-MM-DD'), 
          dateRangeTo: moment(dateTo).format('YYYY-MM-DD'), 
          trackingView: '', // Corrected value
          levelOfDetail: '',
          requestControlledAccessDataCodes: false
        },
        headers: {
          'Authorization': `Basic ${this.token}`,
          'Accept': 'application/json',
          'Message-Reference': `tracking-request-${Date.now()}`,
          'Message-Reference-Date': new Date().toUTCString()
        },
        timeout: 10000 // 10 seconds timeout
      });
  
      console.log('Detalles completos de la respuesta de rastreo de DHL:', JSON.stringify(response.data, null, 2));
  
      return mapDHLTrackingResponse(response.data);
  
    } catch (error) {
      console.error('Error al rastrear guía con DHL:', error.response ? error.response.data : error.message);
      throw new Error(`Error al rastrear guía con DHL: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  }

  async getQuote(shipmentDetails) {
    try {
      if (
        !shipmentDetails ||
        !shipmentDetails.cp_origen ||
        !shipmentDetails.cp_destino
      ) {
        throw new Error("Datos de envío incompletos");
      }
      const params = this.buildQuoteQueryParams(shipmentDetails);
      console.log(
        "Iniciando cotización DHL con parámetros:",
        JSON.stringify(params)
      );
      const response = await axios.get(`${this.apiBase}/rates`, {
        params: params,
        headers: {
          Authorization: `Basic ${this.token}`,
          Accept: "application/json",
          "Message-Reference": `quotation-request-${Date.now()}`,
          "Message-Reference-Date": new Date().toUTCString(),
        },
        timeout: 10000, // 10 segundos de timeout
      });

      let mappedResponse = mapDHLResponse(response.data, shipmentDetails);
      // Aplicar los porcentajes a los precios devueltos
      mappedResponse = await this.applyPercentagesToQuote(mappedResponse);

      return {
        paqueterias: mappedResponse,
      };
    } catch (error) {
      console.error("Error en DHL Quote API:", error);
      if (error.response) {
        console.error(
          "Datos de respuesta de error:",
          JSON.stringify(error.response.data)
        );
        console.error("Estado de respuesta de error:", error.response.status);
        console.error(
          "Cabeceras de respuesta de error:",
          JSON.stringify(error.response.headers)
        );
      } else if (error.request) {
        console.error(
          "No se recibió respuesta. Detalles de la solicitud:",
          JSON.stringify(error.request)
        );
      }
      throw new Error(
        "Error al obtener las cotizaciones de DHL: " +
          (error.response ? JSON.stringify(error.response.data) : error.message)
      );
    }
  }
  

  // async applyPercentagesToQuote(quotes) {
  //   const dhlService = await Service.findOne({ name: 'DHL' });
  //   if (!dhlService) {
  //     console.warn('No se encontraron porcentajes para DHL');
  //     return quotes;
  //   }

  //   return quotes.map(quote => {
  //     const provider = dhlService.providers.find(p => p.name === 'DHL');
  //     if (provider) {
  //       const service = provider.services.find(s => s.idServicio === quote.idServicio);
  //       if (service) {
  //         const percentage = service.percentage / 100 + 1;
  //         quote.precio_regular = quote.precio;
  //         quote.precio = (parseFloat(quote.precio) * percentage).toFixed(2);
  //       }
  //     }
  //     return quote;
  //   });
  // }

  async applyPercentagesToQuote(quoteResponse) {
    const dhlService = await Service.findOne({ name: "DHL" });
  
    if (!dhlService) {
      console.warn("No se encontraron porcentajes para DHL");
      return quoteResponse;
    }
  
    if (quoteResponse && Array.isArray(quoteResponse)) {
      // Preprocesar los servicios en un índice basado en nombre_servicio
      const serviceMap = {};
      const provider = dhlService.providers[0];
      provider.services.forEach((service) => {
        serviceMap[service.name] = service;
      });
  
      // Mapear los quotes utilizando el índice preprocesado
      quoteResponse = quoteResponse
        .map((quote) => {
          const service = serviceMap[quote.nombre_servicio];
  
          if (!service) {
            return null; // Filtraremos después
          }
  
          const precio_guia = quote.precio / 0.95;
          const precio_venta = precio_guia / (1 - service.percentage / 100);
  
          const utilidad = precio_venta - precio_guia;
          const utilidad_dagpacket = utilidad * 0.3;
          const precio_guia_lic = precio_guia + utilidad_dagpacket;
  
          return {
            ...quote,
            precio: precio_venta.toFixed(2),
            precio_regular: precio_guia_lic.toFixed(2),
            precio_guia: precio_guia.toFixed(2),
            status: service.status,
          };
        })
        .filter((quote) => quote !== null); // Filtrar los elementos nulos
    }
  
    return quoteResponse;
  }
  
  

  buildQuoteQueryParams(shipmentDetails) {
    return {
      accountNumber: this.account,
      originCountryCode: shipmentDetails.pais_origen,
      originPostalCode: shipmentDetails.cp_origen,
      originCityName: shipmentDetails.coloniaRemitente || "Ciudad desconocida",
      destinationCountryCode: shipmentDetails.pais_destino,
      destinationPostalCode: shipmentDetails.cp_destino,
      destinationCityName:
        shipmentDetails.coloniaDestinatario || "Ciudad desconocida",
      weight: shipmentDetails.peso,
      length: shipmentDetails.largo,
      width: shipmentDetails.ancho,
      height: shipmentDetails.alto,
      plannedShippingDate: new Date().toISOString().split("T")[0],
      isCustomsDeclarable: false,
      unitOfMeasurement: "metric",
      nextBusinessDay: false,
      strictValidation: false,
      getAllValueAddedServices: false,
      requestEstimatedDeliveryDate: true,
      estimatedDeliveryDateType: "QDDF",
    };
  }

  buildHeaders() {
    return {
      Authorization: `Basic ${this.token}`,
      Accept: "application/json",
      "Message-Reference": `quotation-request-${Date.now()}`,
      "Message-Reference-Date": new Date().toUTCString(),
      "Plugin-Name": "DHLExpressRates",
      "Plugin-Version": "1.0",
      "Shipping-System-Platform-Name": "Node.js",
      "Shipping-System-Platform-Version": process.version,
      "Webstore-Platform-Name": "Custom",
      "Webstore-Platform-Version": "1.0",
    };
  }

  async createShipment(shipmentData) {
    try {
      console.log(
        "Iniciando creación de envío DHL con datos:",
        JSON.stringify(shipmentData)
      );

      const requestBody = mapToDHLShipmentFormat(shipmentData, this.account);
      const response = await axios.post(
        `${this.apiBase}/shipments`,
        requestBody,
        {
          headers: {
            Authorization: `Basic ${this.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "Message-Reference": `shipment-request-${Date.now()}`,
            "Message-Reference-Date": new Date().toUTCString(),
          },
          timeout: 30000, // 30 segundos de timeout
        }
      );

      return {
        success: true,
        message: "Guía generada exitosamente",
        data: {
          guideNumber: response.data.shipmentTrackingNumber,
          trackingUrl:
            response.data.trackingUrl ||
            `https://www.dhl.com/en/express/tracking.html?AWB=${response.data.shipmentTrackingNumber}`,
          packages: response.data.packages,
          documents: response.data.documents,
          shipmentTrackingNumber: response.data.shipmentTrackingNumber,
          pdfBuffer: response.data.documents.find(
            (doc) => doc.typeCode === "label"
          )?.content,
        },
      };
    } catch (error) {
      console.error("Error en DHL Shipment API:", error);
      if (error.response) {
        console.error(
          "Datos de respuesta de error:",
          JSON.stringify(error.response.data)
        );
        console.error("Estado de respuesta de error:", error.response.status);
        console.error(
          "Cabeceras de respuesta de error:",
          JSON.stringify(error.response.headers)
        );

        if (error.response.status === 422) {
          const validationErrors =
            error.response.data.detail || "Error de validación desconocido";
          throw new Error(`Error de validación en DHL: ${validationErrors}`);
        }
      }
      throw new Error(
        "Error al crear el envío con DHL: " +
          (error.response?.data?.detail || error.message)
      );
    }
  }
}

module.exports = new DHLService();
