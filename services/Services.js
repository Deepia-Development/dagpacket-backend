const Service = require('../models/ServicesModel');

class ShippingService {
  async getAllServices() {
    return await Service.find();
  }

  async getServiceByName(name) {
    return await Service.findOne({ name });
  }

  async addProvider(serviceName, providerData) {
    return await Service.findOneAndUpdate(
      { name: serviceName },
      { $push: { providers: providerData } },
      { new: true }
    );
  }

  async addServiceToProvider(serviceName, providerName, serviceData) {
    return await Service.findOneAndUpdate(
      { name: serviceName, 'providers.name': providerName },
      { $push: { 'providers.$.services': serviceData } },
      { new: true }
    );
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

  async adjustPrice(serviceName, providerName, idServicio, basePrice) {
    const service = await this.getServiceByName(serviceName);
    if (!service) throw new Error('Service not found');

    const provider = service.providers.find(p => p.name === providerName);
    if (!provider) throw new Error('Provider not found');

    const specificService = provider.services.find(s => s.idServicio === idServicio);
    if (!specificService) throw new Error('Specific service not found');

    return basePrice * (1 + specificService.percentage / 100);
  }
}

module.exports = new ShippingService();