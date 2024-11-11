const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BillModel = new Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: "users", required: true },
  shipment_ids: { type: mongoose.Types.ObjectId, ref: "Shipments" },
  bill_number: { type: String, required: true },
  status: { type: Boolean, required: true },
});

module.exports = mongoose.model("Bill", BillModel);