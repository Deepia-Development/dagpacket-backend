// routes/cashRegisterRoutes.js
const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/CashRegisterController');
const { isAdmin } = require('../middlewares/AdminAuth')

router.post('/open', cashRegisterController.openCashRegister);
router.post('/close', cashRegisterController.closeCashRegister);
router.get('/current', cashRegisterController.getCurrentCashRegister);
router.get('/transactions', cashRegisterController.getCashTransactions);
router.get('/all', isAdmin, cashRegisterController.getAllCashRegisters);

module.exports = router;