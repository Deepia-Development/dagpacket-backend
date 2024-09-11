const CancellationController = require('../controllers/CancellattionRequestController');
const express = require('express');
const router = express.Router();

// Ruta para crear una solicitud de cancelación
router.post('/request', CancellationController.createCancellationRequest);

// Ruta para obtener todas las solicitudes de cancelación
router.get('/all', CancellationController.getAllCancellationRequests);

// Ruta para obtener las solicitudes de cancelación de un usuario específico
router.get('/:id', CancellationController.getCancellationRequests);

router.patch('/:id', CancellationController.updateCancellationRequest);

module.exports = router;


