const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashRegisterSchema = new Schema({
  licensee_id: { type: Schema.Types.ObjectId, ref: 'Users', required: false },
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: false }, // ✅ Corregido "red" a "ref"
  opened_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opened_at: { type: Date, default: Date.now },
  closed_by: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // ✅ Ahora por defecto es null
  closed_at: { type: Date, default: null }, // ✅ Ahora por defecto es null
  status: { type: String, enum: ['open', 'closed', 'pending_review'], default: 'open' },
  total_sales: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CashRegister', CashRegisterSchema);
