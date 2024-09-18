const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LockerLoginModel = new Schema({
  size: { type: String, required: true },
  stored_package: { type: String, required: true },
  status: { type: String, required: true },
  ubication: { type: String, required: true },
  street: { type: String, required: true },
  cp: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  date: { type: Date, required: true },
});

module.exports = mongoose.model("LockerLogin", LockerLoginModel);
