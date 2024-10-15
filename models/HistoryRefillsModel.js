// models/transaction.model.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  Date_Time: { type: Date, required: true },
  Terminal_Id: { type: Number, required: true },
  Response_Transaction: { type: Number, required: true },
  Invonve_Id: { type: Number, required: true },
  Product_Id: { type: Number, required: true },
  Amount_Id: { type: Number, required: true },
  Account_Id: { type: Number, required: true },
  ResponseCode: { type: Number, required: true }
});

const Transaction = mongoose.model('TransactionRecharguesLog', transactionSchema);

module.exports = Transaction;
