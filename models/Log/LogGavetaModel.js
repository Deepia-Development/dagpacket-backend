const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LogGabetaModel = new Schema({
  locker_id: { type: Schema.Types.ObjectId, ref: "lockers", required: true }, // Referencia a la colección "lockers"
  gabeta_id : { type: String, ref: "gabetas", required: true },
  client_id: { type: String, default: null, required: false },
  account_id: { type: String, default: null, required: false },
  purchase_id: { type: String, default: null, required: false },
  date_time: { type: Date, default: Date.now, required: false },
  action: { type: String, default: null, required: false },
  sell: { type: Number, default: null, required: false },
  buy: { type: Number, default: null, required: false },
  profit: { type: Number, default: null, required: false },
  delivery: { type: String, default: null, required: false },
  technician: { type: String, default: null, required: false },
  delivery_driver: { type: String, default: null, required: false },
  delivery_person: { type: String, default: null, required: false },
  device: { type: String, default: null, required: false },
});

module.exports = mongoose.model("Log_Gabeta", LogGabetaModel);
