const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CancellationRequestModel = new Schema({
    user_id: { type: mongoose.Types.ObjectId, ref: 'Users' },
    shipment_id: { type: String, required: true },
    motive: { type: String, required: true },
    status: { type: String, enum: ['Pendiente', 'Aprobado', 'Rechazado'], default: 'Pendiente' },        
    timestamp: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Cancellations', CancellationRequestModel )