// models/TransactionModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionModel = new Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  sub_user_id: { type: mongoose.Types.ObjectId, ref: 'Users' },
  shipment_ids: [{ type: mongoose.Types.ObjectId, ref: 'Shipments' }],
  service: { type: String, required: true },
  transaction_number: { type: String, required: true },
  payment_method: { type: String, required: true },
  previous_balance: { type: Schema.Types.Decimal128, required: true },
  new_balance: { type: Schema.Types.Decimal128, required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  details: { type: String },
  cash_register_id: { type: mongoose.Types.ObjectId, ref: 'CashRegister' },
  employee_id: { type: mongoose.Types.ObjectId, ref: 'Employee' },
  status : { type: String, enum: ['Pagado', 'Reembolsado', 'Reembolsado con comision'] },
  transaction_date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionModel);