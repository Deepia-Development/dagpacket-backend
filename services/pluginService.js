const axios = require('axios');
const config = require('../config/config');
const { mapDHLResponse, mapToDHLShipmentFormat } = require('../utils/dhlMapper');

class DHLService {
  constructor() {
    this.apiBase = config.dhl.apiBase;
    this.token = config.dhl.token;
    this.account = config.dhl.account;
  }

  async getQuote(shipmentDetails) {
    try {
      if (!shipmentDetails || !shipmentDetails.cp_origen || !shipmentDetails.cp_destino) {
        throw new Error('Datos de envío incompletos');
      }
      const params = this.buildQuoteQueryParams(shipmentDetails);
      const response = await axios.get(`${this.apiBase}/rates`, {
        params: params,
        headers: this.buildHeaders(),
        timeout: 10000 // 10 segundos de timeout
      });

      return mapDHLResponse(response.data, shipmentDetails);
    } catch (error) {
      console.error('Error en DHL Quote API:', error);
      this.logError(error);
      throw new Error('Error al obtener las cotizaciones de DHL: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
  }

  buildQuoteQueryParams(shipmentDetails) {
    return {
      accountNumber: this.account,
      originCountryCode: shipmentDetails.pais_origen,
      originPostalCode: shipmentDetails.cp_origen,
      originCityName: shipmentDetails.ciudad_origen || 'Ciudad desconocida',
      destinationCountryCode: shipmentDetails.pais_destino,
      destinationPostalCode: shipmentDetails.cp_destino,
      destinationCityName: shipmentDetails.ciudad_destino || 'Ciudad desconocida',
      weight: shipmentDetails.peso,
      length: shipmentDetails.largo,
      width: shipmentDetails.ancho,
      height: shipmentDetails.alto,
      plannedShippingDate: new Date().toISOString().split('T')[0],
      isCustomsDeclarable: false,
      unitOfMeasurement: 'metric',
      nextBusinessDay: false,
      strictValidation: false,
      getAllValueAddedServices: false,
      requestEstimatedDeliveryDate: true,
      estimatedDeliveryDateType: 'QDDF'
    };
  }

  buildHeaders() {
    return {
      'Authorization': `Basic ${this.token}`,
      'Accept': 'application/json',
      'Message-Reference': `quotation-request-${Date.now()}`,
      'Message-Reference-Date': new Date().toUTCString(),
      'Plugin-Name': 'DHLExpressRates',
      'Plugin-Version': '1.0',
      'Shipping-System-Platform-Name': 'Node.js',
      'Shipping-System-Platform-Version': process.version,
      'Webstore-Platform-Name': 'Custom',
      'Webstore-Platform-Version': '1.0'
    };
  }

  async createShipment(shipmentData) {
    try {
      console.log('Iniciando creación de envío DHL con datos:', JSON.stringify(shipmentData));

      const requestBody = mapToDHLShipmentFormat(shipmentData, this.account);
      const response = await axios.post(`${this.apiBase}/shipments`, requestBody, {
        headers: {
          ...this.buildHeaders(),
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos de timeout
      });

      return {
        success: true,
        message: "Guía generada exitosamente",
        data: {
          guideNumber: response.data.shipmentTrackingNumber,
          trackingUrl: response.data.trackingUrl || `https://www.dhl.com/en/express/tracking.html?AWB=${response.data.shipmentTrackingNumber}`,
          packages: response.data.packages,
          documents: response.data.documents,
          shipmentTrackingNumber: response.data.shipmentTrackingNumber,
          pdfBuffer: response.data.documents.find(doc => doc.typeCode === 'label')?.content
        }
      };
    } catch (error) {
      console.error('Error en DHL Shipment API:', error);
      this.logError(error);
      throw new Error('Error al crear el envío con DHL: ' + (error.response?.data?.detail || error.message));
    }
  }

  logError(error) {
    if (error.response) {
      console.error('Datos de respuesta de error:', JSON.stringify(error.response.data));
      console.error('Estado de respuesta de error:', error.response.status);
      console.error('Cabeceras de respuesta de error:', JSON.stringify(error.response.headers));
    } else if (error.request) {
      console.error('No se recibió respuesta. Detalles de la solicitud:', JSON.stringify(error.request));
    }
  }
}

module.exports = new DHLService();