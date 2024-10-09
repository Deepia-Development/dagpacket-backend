const express = require('express');
const scanController = require('../controllers/scanController');

const router = express.Router();

// Obtener todos los escaneos
router.get('/scans', scanController.getAllScans);

// Actualizar un código de barras existente
router.put('/scans/:id', scanController.updateBarcode);

// Agregar un nuevo código de barras
router.post('/scans', scanController.createBarcode);  // NUEVA RUTA POST

module.exports = router;
