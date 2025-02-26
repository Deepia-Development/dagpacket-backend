// routes/cashRegisterRoutes.js
const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/CashRegisterController');
const { isAdmin } = require('../middlewares/AdminAuth')

router.post('/open', cashRegisterController.openCashRegister);
router.post('/close', cashRegisterController.closeCashRegister);
router.get('/current', cashRegisterController.getCurrentCashRegister);
router.get('/transactions', cashRegisterController.getCashTransactions);
router.get('/licensee', cashRegisterController.getCashRegisterByLicenseId);
router.get('/parentUser', cashRegisterController.getCashRegisterByParentUser);
router.get('/transactionByUser', cashRegisterController.getTransactionsForCashRegisters);
router.patch('/close/:id', cashRegisterController.closeCashRegisterById);
router.get('/getCashRegisterByUserId/:id', cashRegisterController.hasOpenCashRegister);

router.get('/all', isAdmin, cashRegisterController.getAllCashRegisters);

module.exports = router;