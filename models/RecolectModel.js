const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RecolectModel = new Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: "Users", required: true },
  name: { type: String, required: true },
  telephone: { type: String, required: true },
  tracking_number: { type: String, required: true },
  delivery: { type: String, required: true },
  note: { type: String },
  status: { type: String, enum: ["Recepcionado", "Enviado"], default: "Recepcionado" },
  image64: { type: Schema.Types.Mixed, required: false },
});

module.exports = mongoose.model("Recolect", RecolectModel);
