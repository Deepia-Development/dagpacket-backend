const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const service = new Schema({
  comission: { type: Number, required: true },
});


module.exports = mongoose.model("EmidaServices", service);