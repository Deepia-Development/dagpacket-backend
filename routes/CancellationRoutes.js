const CancellationController = require('../controllers/CancellattionRequestController');
const router = require('express').Router();

// Ruta para crear una solicitud de cancelación
router.post('/request', async (req, res) => {
    CancellationController.createCancellationRequest(req, res);
});

// Ruta para obtener todas las solicitudes de cancelación
router.get('/all', CancellationController.getAllCancellationRequests);

// Ruta para obtener las solicitudes de cancelación de un usuario específico
router.get('/:id', async (req, res) => {
    CancellationController.getCancellationRequests(req, res);
});

router.patch('/:id', CancellationController.updateCancellationRequest);

module.exports = router;