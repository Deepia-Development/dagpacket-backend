const express = require('express');
const router = express.Router();
const ShippingController = require('../controllers/ServicesController');

// Obtener todos los servicios
router.get('/services', ShippingController.getAllServices);

// Actualizar el porcentaje de utilidad de un servicio
router.put('/services/:serviceName/providers/:providerName/services/:idServicio', ShippingController.updateServiceUtility);

module.exports = router;