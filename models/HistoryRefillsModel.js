// models/transaction.model.js
const mongoose = require('mongoose');


const transactionSchema = new mongoose.Schema({
  Date_Time: { type: Date, default: Date.now, required: false },
  user_id: { type: mongoose.Types.ObjectId, required: true },
  Service: { type: String, required: true },
  ReferenceNumber: { type: String, required: true },
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
