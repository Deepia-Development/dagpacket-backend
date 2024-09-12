// models/scanService.js
const mongoose = require('mongoose');

const scanServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barcode: { type: String, required: true }
});

module.exports = mongoose.model('ScanService', scanServiceSchema);
