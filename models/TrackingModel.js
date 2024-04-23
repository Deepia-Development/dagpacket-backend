const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackingModel = new Schema({
    shipment_id: { type: Schema.Types.ObjectId, ref: 'Shipments' },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    area: { type: String, required: true },
    description: { type: String, required: true }
})

module.exports = mongoose.model('Tracking', TrackingModel);