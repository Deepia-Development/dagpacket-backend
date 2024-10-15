// models/transaction.model.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  Date_Time: { type: Date, default: Date.now, required: false },
  Terminal_Id: { type: String, required: true },
  Response_Transaction: { type: String, required: true },
  Inovice_Id: { type: String, required: true },
  Product_Id: { type: String, required: true },
  Amount_Id: { type: String, required: true },
  Account_Id: { type: String, required: true },
  ResponseCode: { type: String, required: true }
});

const Transaction = mongoose.model('TransactionRecharguesLog', transactionSchema);

module.exports = Transaction;
