const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GabetaModel = new Schema({
  id_gabeta: { type: String },
  id_locker: { type: mongoose.Types.ObjectId, ref: "Locker" },
  size: { type: String, required: true },
  weight: { type: String, required: false },
  package: { type: String, required: true },
  status: { type: String, required: true },
  ubication: { type: String, required: true },
  street: { type: String, required: true },
  cp: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
});

module.exports = mongoose.model("Gabeta", GabetaModel);
