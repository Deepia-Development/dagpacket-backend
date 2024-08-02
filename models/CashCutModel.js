// models/CashCutModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashCutModel = new Schema({
  cash_register_id: { type: mongoose.Types.ObjectId, ref: 'CashRegister', required: true },
  employee_id: { type: mongoose.Types.ObjectId, ref: 'Employee', required: true },
  initial_balance: { type: Schema.Types.Decimal128, required: true },
  final_balance: { type: Schema.Types.Decimal128, required: true },
  cash_income: { type: Schema.Types.Decimal128, required: true },
  card_income: { type: Schema.Types.Decimal128, required: true },
  balance_income: { type: Schema.Types.Decimal128, required: true },
  total_income: { type: Schema.Types.Decimal128, required: true },
  cut_date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CashCut', CashCutModel);