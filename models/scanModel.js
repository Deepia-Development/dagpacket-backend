const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  _id: String,
  name: String,
  barcode: String
});

const Scan = mongoose.model('Scan', scanSchema, 'scan_service');
module.exports = Scan;
