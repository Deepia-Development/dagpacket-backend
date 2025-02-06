// models/CashTransactionModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashTransactionModel = new Schema({
  cash_register_id: { type: mongoose.Types.ObjectId, ref: 'CashRegister', required: true },
  transaction_id: { type: mongoose.Types.ObjectId, ref: 'transactions' },
  operation_by : { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  shipment_id: { type: mongoose.Types.ObjectId, ref: 'Shipments' },
  transaction_type: { type: String, enum: ['ingreso', 'egreso'], default: 'ingreso' },
  payment_method: { type: String, enum: ['efectivo', 'td-debito', 'td-credito', 'saldo'], required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  dagpacket_commission: { type: Schema.Types.Decimal128 },
  transaction_number: { type: String },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CashTransaction', CashTransactionModel);