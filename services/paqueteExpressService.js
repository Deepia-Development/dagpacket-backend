// services/paqueteExpressService.js

const axios = require('axios');
const config = require('../config/config');
const { mapPaqueteExpressResponse, mapToPaqueteExpressShipmentFormat } = require('../utils/paqueteExpressMapper');

class PaqueteExpressService {
  constructor() {
    this.quoteUrl = config.paqueteExpress.quoteUrl;
    this.createShipmentUrl = config.paqueteExpress.createShipmentUrl;
    this.reportUrl = config.paqueteExpress.reportUrl;
    this.user = config.paqueteExpress.user;
    this.password = config.paqueteExpress.password;
    this.token = config.paqueteExpress.token;
  }

  async getQuote(shipmentDetails) {
    try {
      if (!shipmentDetails || !shipmentDetails.cp_origen || !shipmentDetails.cp_destino) {
        throw new Error('Datos de envío incompletos');
      }

      const requestBody = this.buildQuoteRequestBody(shipmentDetails);
      
      const response = await axios.post(this.quoteUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos de timeout
      });

      const mappedResponse = mapPaqueteExpressResponse(response.data, shipmentDetails);
      
      return {
        paqueterias: mappedResponse
      };
    } catch (error) {
      console.error('Error en Paquete Express Quote API:', error.response ? JSON.stringify(error.response.data) : error.message);
      throw new Error('Error al obtener las cotizaciones de Paquete Express: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
  }

  buildQuoteRequestBody(shipmentDetails) {
    return {
      header: {
        security: {
          user: this.user,
          password: this.password,
          type: 1,
          token: this.token
        },
        device: {
          appName: "Customer",
          type: "Web",
          ip: "",
          idDevice: ""
        },
        target: {
          module: "QUOTER",
          version: "1.0",
          service: "quoter",
          uri: "quotes",
          event: "R"
        },
        output: "JSON",
        language: null
      },
      body: {
        request: {
          data: {
            clientAddrOrig: {
              zipCode: shipmentDetails.cp_origen,
              colonyName: "NA"
            },
            clientAddrDest: {
              zipCode: shipmentDetails.cp_destino,
              colonyName: "NA"
            },
            services: {
              dlvyType: "1",
              ackType: "N",
              totlDeclVlue: shipmentDetails.valor_declarado,
              invType: "A",
              radType: "1"
            },
            otherServices: {
              otherServices: []
            },
            shipmentDetail: {
              shipments: [
                {
                  sequence: 1,
                  quantity: 1,
                  shpCode: "2",
                  weight: shipmentDetails.peso,
                  longShip: shipmentDetails.largo,
                  widthShip: shipmentDetails.ancho,
                  highShip: shipmentDetails.alto
                }
              ]
            },
            quoteServices: [
              "ALL"
            ]
          },
          objectDTO: null
        },
        response: null
      }
    };
  }

  async createShipment(shipmentData) {
    try {
      //console.log('Iniciando creación de envío en Paquete Express');
      //console.log('Datos de envío:', JSON.stringify(shipmentData, null, 2));
  
      const requestBody = mapToPaqueteExpressShipmentFormat(shipmentData, this.user, this.password, this.token);
      //console.log('Cuerpo de la solicitud:', JSON.stringify(requestBody, null, 2));
      
      //console.log('URL de creación de envío:', this.createShipmentUrl);
  
      const response = await axios.post(this.createShipmentUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
  
      //console.log('Respuesta completa de Paquete Express:', JSON.stringify(response.data, null, 2));
  
      if (!response.data.body || !response.data.body.response || !response.data.body.response.success) {
        console.error('Respuesta inesperada de Paquete Express:', JSON.stringify(response.data, null, 2));
        throw new Error('Respuesta inesperada al crear el envío en Paquete Express');
      }
  
      //console.log('Envío creado exitosamente en Paquete Express');
      return response.data.body.response;
    } catch (error) {
      console.error('Error detallado en Paquete Express createShipment:', error);
      if (error.response) {
        console.error('Datos de la respuesta de error:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Error al crear el envío en Paquete Express: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
  }

  async generateGuide(trackingNumber) {
    try {
      const url = this.reportUrl.replace('05167890591', trackingNumber);
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('Error al generar la guía de Paquete Express:', error.message);
      throw new Error('Error al generar la guía de Paquete Express: ' + error.message);
    }
  }

  async createShipmentAndGenerateGuide(shipmentData) {
    try {
      const shipmentResponse = await this.createShipment(shipmentData);
      const trackingNumber = shipmentResponse.data;
      const guideBuffer = await this.generateGuide(trackingNumber);

      return {
        success: true,
        message: "Guía generada exitosamente",
        data: {
          guideNumber: trackingNumber,
          trackingUrl: `https://www.paqueteexpress.com.mx/rastreo/${trackingNumber}`,
          additionalInfo: {
            folioLetterPorte: shipmentResponse.objectDTO,
            creditAmnt: shipmentResponse.additionalData ? shipmentResponse.additionalData.creditAmnt : null,
            subTotlAmnt: shipmentResponse.additionalData ? shipmentResponse.additionalData.subTotlAmnt : null,
            totalAmnt: shipmentResponse.additionalData ? shipmentResponse.additionalData.totalAmnt : null
          }
        },
        pdfBuffer: guideBuffer
      };
    } catch (error) {
      console.error('Error al crear envío y generar guía:', error);
      throw new Error('Error al crear envío y generar guía: ' + error.message);
    }
  }
}

module.exports = new PaqueteExpressService();