const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BillModel = new Schema({
  generated_by: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: false,
  },
  shipment_ids: { type: mongoose.Types.ObjectId, ref: "Shipments" },
  status: { type: Boolean, required: true },
  reference: { type: String, required: true },
});

module.exports = mongoose.model("Bill", BillModel);
