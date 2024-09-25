const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GabetaModel = new Schema({
  id_gabeta: { type: String },
  id_locker: { type: mongoose.Types.ObjectId, ref: "lockers" },
  type: { type: String, required: true },
  gabeta_dimension: { type: String, required: true },
  size: { type: String, required: false },
  weight: { type: String, required: false },
  package: { type: String, required: false },
  status: { type: String, required: true },
  ubication: { type: String, required: true },
  street: { type: String, required: true },
  cp: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  status: { type: Boolean, required: true },
  saturation: { type: Boolean, required: true },
  pin: { type: String, required: true },
  client_pin: { type: String, required: true },
});

module.exports = mongoose.model("Gabeta", GabetaModel);
