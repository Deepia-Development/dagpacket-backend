const express = require('express');
const router = express.Router();
const scanServiceController = require('../controllers/scanController');

// Ruta para obtener todos los registros de scan_service
router.get('/scans', scanServiceController.getScans);

module.exports = router;

