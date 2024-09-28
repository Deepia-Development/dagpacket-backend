const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GavetaSizeModel = new Schema({
  size: { type: String, required: true },
  dimension: { type: String, required: true },
});

module.exports = mongoose.model("gaveta_size", GavetaSizeModel);
