const CancellationController = require('../controllers/CancellattionRequestController');
const express = require('express');
const router = express.Router();

// Ruta para crear una solicitud de cancelación
router.post('/request', CancellationController.createCancellationRequest);

// Ruta para obtener todas las solicitudes de cancelación
router.get('/all', CancellationController.getAllCancellationRequests);

router.get('/all/pending/count', CancellationController.countPendingCancellationRequests);
router.get('/all/pending', CancellationController.getAllCancellationRequestPending);

// Ruta para obtener las solicitudes de cancelación de un usuario específico
router.get('/:id', CancellationController.getCancellationRequests);

router.patch('/:id', CancellationController.updateCancellationRequest);

router.get('/read/:id', CancellationController.getCancellationRequestsById);

module.exports = router;


