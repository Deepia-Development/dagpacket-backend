// refillRequestRoutes.js
const express = require('express');
const router = express.Router();
const refillRequestController = require('../controllers/RefillControler');
const { isAdmin } = require('../middlewares/AdminAuth');

// Ruta para crear una solicitud de reabastecimiento
router.post('/create', refillRequestController.createRefillRequest);

// Ruta para aprobar una solicitud de reabastecimiento (solo admin)
router.post('/approve/:requestId', isAdmin, refillRequestController.approveRefillRequest);

// Ruta para rechazar una solicitud de reabastecimiento (solo admin)
router.post('/reject/:requestId', isAdmin, refillRequestController.rejectRefillRequest);

router.get('/refill-requests', refillRequestController.getRefillRequests);

module.exports = router;