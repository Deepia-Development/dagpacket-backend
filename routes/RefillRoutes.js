// refillRequestRoutes.js
const express = require('express');
const router = express.Router();
const refillRequestController = require('../controllers/RefillControler');
const { isAdmin } = require('../middlewares/AdminAuth');

// Ruta para crear una solicitud de reabastecimiento
router.post('/create', refillRequestController.createRefillRequest);
router.post('/create-transfer', refillRequestController.createTransferRequest);
router.get('/getAllUsersInventory', refillRequestController.getAllUsersInventory);
router.get('/user-transfer-requests/:userId', refillRequestController.getUserTransferRequests);
router.get('/transfer-requests', refillRequestController.getTransferRequests);
router.get('/user-refill-requests/:userId', refillRequestController.getUserRefillRequests);
// Ruta para aprobar una solicitud de reabastecimiento (solo admin)
router.post('/approve/:requestId', isAdmin, refillRequestController.approveRefillRequest);
router.post('/approve-transfer/:requestId', refillRequestController.approveTransferRequest);
// Ruta para rechazar una solicitud de reabastecimiento (solo admin)
router.post('/reject/:requestId', isAdmin, refillRequestController.rejectRefillRequest);
router.post('/reject-transfer/:requestId', refillRequestController.rejectTransferRequest);
router.get('/refill-requests', refillRequestController.getRefillRequests);
router.get('/utilidad-dag', refillRequestController.utilitie_package_dag);
router.get('/utilidad-lic', refillRequestController.utilitie_package_lic);
router.post('/sell-packs', refillRequestController.sellPackage);
// Ruta para transacciones
router.get('/transactions', refillRequestController.getTransactions);
router.get('/transactions/user', refillRequestController.getTransactionsByUser);
// Inventario de paquetes
router.get('/inventory/:userId', refillRequestController.getUserInventory);
module.exports = router;