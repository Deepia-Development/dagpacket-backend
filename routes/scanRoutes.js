
const express = require('express');
const scanController = require('../controllers/scanController');  // Importamos el controlador

const router = express.Router();

// Ruta para obtener todos los escaneos
router.get('/scans', scanController.getAllScans);

// Ruta para crear un nuevo escaneo
//router.post('/scans', scanController.createScan);

module.exports = router;