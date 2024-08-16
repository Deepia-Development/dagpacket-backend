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
  
  const strategies = {
    fedex: new FedexStrategy(),
    superenvios: new SuperEnviosStrategy(),
  };
  
  module.exports = {
    strategies,
    ShippingStrategy
  };