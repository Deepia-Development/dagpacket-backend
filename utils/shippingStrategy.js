class ShippingStrategy {
  async generateGuide(shipmentData) {
    throw new Error('generateGuide method must be implemented');
  }

  async getQuote(quoteData) {
    throw new Error('getQuote method must be implemented');
  }
}

const FedexService = require('../services/fedexService');
const SuperEnviosService = require('../services/superEnviosService');
const PaqueteExpressService = require('../services/paqueteExpressService');
const DHLService = require('../services/dhlService');
const EstafetaService = require('../services/estafetaService')

class FedexStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    return await FedexService.createShipment(shipmentData);
  }

  async getQuote(quoteData) {
    return await FedexService.getQuote(quoteData);
  }
}

class SuperEnviosStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    return await SuperEnviosService.generateGuide(shipmentData);
  }

  async getQuote(quoteData) {
    return await SuperEnviosService.getQuote(quoteData);
  }
}

class EstafetaStrategy extends ShippingStrategy {
  async getQuote(quoteData) {
    return await EstafetaService.getQuote(quoteData);
  }
}


class PaqueteExpressStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    try {      
      const createShipmentResponse = await PaqueteExpressService.createShipment(shipmentData);            
      const guideBuffer = await PaqueteExpressService.generateGuide(createShipmentResponse.data);            
      const { mapPaqueteExpressGuideResponse } = require('../utils/paqueteExpressMapper');
      return mapPaqueteExpressGuideResponse(createShipmentResponse, guideBuffer);
    } catch (error) {
      console.error('Error al generar guía con Paquete Express:', error);
      throw new Error('Error al generar guía con Paquete Express: ' + error.message);
    }
  }

  async getQuote(quoteData) {
    return await PaqueteExpressService.getQuote(quoteData);
  }
}

class DHLStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    try {
      const response = await DHLService.createShipment(shipmentData);
      
      if (!response.success || !response.data.guideNumber) {
        throw new Error('Error al generar guía con DHL: ' + (response.message || 'Respuesta inesperada'));
      }

      const labelContent = response.data.documents.find(doc => doc.typeCode === 'label')?.content;
      if (!labelContent) {
        throw new Error('No se encontró el contenido de la etiqueta en la respuesta de DHL');
      }

      return {
        success: true,
        message: "Guía generada exitosamente con DHL",
        data: {
          guideNumber: response.data.guideNumber,
          trackingUrl: response.data.trackingUrl,
          labelUrl: null, // DHL proporciona el contenido de la etiqueta directamente
          additionalInfo: {
            packages: response.data.packages,
            shipmentTrackingNumber: response.data.shipmentTrackingNumber
          },
          pdfBuffer: Buffer.from(labelContent, 'base64') // Convertimos el contenido base64 a un buffer
        }
      };
    } catch (error) {
      console.error('Error al generar guía con DHL:', error);
      throw new Error('Error al generar guía con DHL: ' + error.message);
    }
  }

  async getQuote(quoteData) {
    return await DHLService.getQuote(quoteData);
  }
}

const strategies = {
  fedex: new FedexStrategy(),
  superenvios: new SuperEnviosStrategy(),
  paqueteexpress: new PaqueteExpressStrategy(),
  dhl: new DHLStrategy(),
  estafeta: new EstafetaStrategy()
};

module.exports = {
  strategies,
  ShippingStrategy
};