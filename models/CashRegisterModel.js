// models/CashRegisterModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashRegisterSchema = new Schema({
  licensee_id: { type: Schema.Types.ObjectId, ref: 'Users', required: false },
  employee_id: { type: Schema.Types.ObjectId, red: 'Employee', required: false},
  opened_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opened_at: { type: Date, default: Date.now },
  closed_by: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  closed_at: { type: Date },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  total_sales: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CashRegister', CashRegisterSchema);