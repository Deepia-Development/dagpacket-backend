// models/ClipModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClipSchema = new Schema({
    operation_by: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
    shipment_ids: [{ type: mongoose.Types.ObjectId, ref: "Shipments" }],
    transaction_id: { type: mongoose.Types.ObjectId, ref: 'Transaction' },
    date: { type: Date, default: Date.now },
    amount: { type: Schema.Types.Decimal128, required: true },
    service: { type: String, enum: ['recarga', 'servicio', 'envio'], required: true },
    status: { type: String, enum: ['pendiente', 'aceptado'], default: 'pendiente' },
});

module.exports = mongoose.model('ClipRembolsos', ClipSchema);
