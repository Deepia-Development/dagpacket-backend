// routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/HistoryRefillsController');

// Ruta para obtener todas las transacciones
router.get('/', transactionController.getTransactions);

// Ruta para obtener una transacción por ID
router.get('/:id', transactionController.getTransactionById);
router.post('/create', transactionController.createTransaction);
module.exports = router;
