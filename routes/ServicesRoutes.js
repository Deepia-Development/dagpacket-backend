const express = require('express');
const ShippingController = require('../controllers/ServicesController');
const router = express.Router();

// Get all services
router.get('/services', ShippingController.getAllServices);

// Add a provider to a service
router.post('/services/:serviceName/providers', ShippingController.addProvider);

// Add a service to a provider
router.post('/services/:serviceName/providers/:providerName/services', ShippingController.addServiceToProvider);

// Update service utility
router.put('/services/:serviceName/providers/:providerName/services/:idServicio', ShippingController.updateServiceUtility);

// Adjust price
router.post('/adjust-price', ShippingController.adjustPrice);

module.exports = router;