const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LockerModel = new Schema({
  id_locker: { type: String , required: true},
  ubication: { type: String, required: true },
  package: { type: String, required: true },
  quant_gabetas: { type: Number, required: true },
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  status: { type: String, required: true },
  capacity: { type: Number, required: true },
  saturation: { type: Number, required: true },
  street: { type: String, required: true },
  cp: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  num_ext: { type: Number, required: true },
  owner: { type: String, required: true },
  
});

module.exports = mongoose.model("Lockers", LockerModel);
