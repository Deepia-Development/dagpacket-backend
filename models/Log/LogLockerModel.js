const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LockerLoginModel = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  id_locker: { type: Schema.Types.ObjectId, ref: "lockers", required: true }, // Referencia a la colección "lockers"
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LockerLogin", LockerLoginModel);
