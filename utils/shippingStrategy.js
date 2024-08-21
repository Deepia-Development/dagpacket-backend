// utils/shippingStrategy.js

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
      // Paso 1: Crear el envío
      const createShipmentResponse = await PaqueteExpressService.createShipment(shipmentData);      
      // Paso 2: Generar la guía
      const guideBuffer = await PaqueteExpressService.generateGuide(createShipmentResponse.data);      
      // Paso 3: Mapear la respuesta a un formato estandarizado
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

const strategies = {
  fedex: new FedexStrategy(),
  superenvios: new SuperEnviosStrategy(),
  paqueteexpress: new PaqueteExpressStrategy(),
};

module.exports = {
  strategies,
  ShippingStrategy
};