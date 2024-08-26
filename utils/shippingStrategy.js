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
    return await DHLService.createShipment(shipmentData);
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
};

module.exports = {
  strategies,
  ShippingStrategy
};