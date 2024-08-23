const Service = require('../models/ServicesModel');

class ShippingService {
  async getAllServices() {
    return await Service.find();
  }

  async updateServiceUtility(serviceName, providerName, idServicio, newPercentage) {
    return await Service.findOneAndUpdate(
      { 
        name: serviceName, 
        'providers.name': providerName, 
        'providers.services.idServicio': idServicio
      },
      { $set: { 'providers.$[prov].services.$[serv].percentage': newPercentage } },
      { 
        arrayFilters: [
          { 'prov.name': providerName },
          { 'serv.idServicio': idServicio }
        ],
        new: true
      }
    );
  }
}

module.exports = new ShippingService();