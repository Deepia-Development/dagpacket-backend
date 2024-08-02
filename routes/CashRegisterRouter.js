// routes/cashRegisterRoutes.js
const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/CashRegisterController');

router.post('/open', cashRegisterController.openCashRegister);
router.post('/close', cashRegisterController.closeCashRegister);
router.get('/current', cashRegisterController.getCurrentCashRegister);
router.get('/transactions', cashRegisterController.getCashTransactions);

module.exports = router;