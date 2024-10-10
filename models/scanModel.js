const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  _id: String,
  name: {
    type: String,
    required: true,
  },
  barcode: {
    type: String,
    required: true,  
    unique: true,    
    minlength: 18,
    maxlength: 18
  }
});



const Scan = mongoose.model('Scan', scanSchema, 'scan_service');
module.exports = Scan;
