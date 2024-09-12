const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');  // Asegúrate de que la ruta sea correcta

// Ruta para obtener los servicios disponibles
router.get('/scan_service', scanController.getAvailableServices);

// Ruta para actualizar el código de barras
router.put('/scan_service/:id', scanController.updateBarcode);

module.exports = router;
