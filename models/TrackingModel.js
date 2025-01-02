const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const TrackingModel = new Schema({
  shipment_id: { type: Schema.Types.ObjectId, ref: 'Shipments' },
  title: { type: String, required: true },
  delivery: { type: Schema.Types.ObjectId, ref:'Users',required: false },
  date: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      const utcOffset = -6; // UTC-6
      const adjustedDate = new Date(now.getTime() + utcOffset * 60 * 60 * 1000);
      return adjustedDate;
    }
  },
  area: { type: String, required: true },
  description: { type: String, required: true }
});

module.exports = mongoose.model('Tracking', TrackingModel);