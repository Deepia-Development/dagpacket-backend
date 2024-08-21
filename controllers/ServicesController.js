const ShippingService = require('../services/Services');

class ShippingController {
  async getAllServices(req, res) {
    try {
      const services = await ShippingService.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async addProvider(req, res) {
    try {
      const { serviceName } = req.params;
      const updatedService = await ShippingService.addProvider(serviceName, req.body);
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async addServiceToProvider(req, res) {
    try {
      const { serviceName, providerName } = req.params;
      const updatedService = await ShippingService.addServiceToProvider(serviceName, providerName, req.body);
      if (!updatedService) {
        return res.status(404).json({ message: 'Service or provider not found' });
      }
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateServiceUtility(req, res) {
    try {
      const { serviceName, providerName, idServicio } = req.params;
      const { newPercentage } = req.body;
      const updatedService = await ShippingService.updateServiceUtility(
        serviceName,
        providerName,
        idServicio,
        newPercentage
      );
      if (!updatedService) {
        return res.status(404).json({ message: 'Service, provider or specific service not found' });
      }
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async adjustPrice(req, res) {
    try {
      const { serviceName, providerName, idServicio, basePrice } = req.body;
      const adjustedPrice = await ShippingService.adjustPrice(serviceName, providerName, idServicio, basePrice);
      res.json({ adjustedPrice });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new ShippingController();