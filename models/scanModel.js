// models/scanService.js

const mongoose = require('mongoose');

const scanServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Nombre es un campo de tipo String
  barcode: { type: String, required: true, unique: true },  // Código de barras es único
}, { timestamps: true });  // Agrega createdAt y updatedAt automáticamente

module.exports = mongoose.model('ScanService', scanServiceSchema);
