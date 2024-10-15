// services/transaction.service.js
const Transaction = require('../models/HistoryRefillsModel');
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
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

const create = async (req,res) => {
  const {
    Date_Time,
    Terminal_Id,
    Response_Transaction,
    Inovice_Id,
    Product_Id,
    Amount_Id,
    Account_Id,
    ResponseCode
  } = req.body;

  try {
    const newTransaction = new Transaction({
      Date_Time,
      Terminal_Id,
      Response_Transaction,
      Inovice_Id,
      Product_Id,
      Amount_Id,
      Account_Id,
      ResponseCode
    });
    await newTransaction.save();
    return successResponse("Transaction created successfully");
  } catch (error) {
    console.log(req.body);
  
    return errorResponse("Error creating transaction");
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,create
};
