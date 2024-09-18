const mongoose = require("mongoose");
const { account } = require("../../services/dhlService");
const Schema = mongoose.Schema;

const LogGabetaModel = new Schema({
  client_id: { type: Number, required: true },
  account_id: { type: Number, required: true },
  purchase_id: { type: Number, required: true },
  date_time: { type: Date, required: true },
  action: { type: String, required: true },
  sell: { type: Number, required: true },
  buy: { type: Number, required: true },
  profit: { type: Number, required: true },
  delivery: { type: Number, required: true },
  technician: { type: String, required: true },
  delivery_driver: { type: String, required: true },
  delivery_person: { type: String, required: true },
});

module.exports = mongoose.model("LogGabeta", LogGabetaModel);
