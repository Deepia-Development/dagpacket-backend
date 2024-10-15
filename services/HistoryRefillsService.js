// services/transaction.service.js
const Transaction = require('../models/HistoryRefillsModel');

const getAllTransactions = async () => {
  try {
    const transactions = await Transaction.find();
    return transactions;
  } catch (error) {
    throw new Error('Error retrieving transactions: ' + error.message);
  }
};

const getTransactionById = async (id) => {
  try {
    const transaction = await Transaction.findById(id);
    return transaction;
  } catch (error) {
    throw new Error('Transaction not found: ' + error.message);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById
};
