// models/Address.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['remitente', 'destinatario'], required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  country_code: { type: String, required: true, default: 'MX' },
  settlement: { type: String, required: true },
  zip_code: { type: String, required: true },
  external_number: { type: String, required: true },
  internal_number: { type: String },
  reference: { type: String },
  rfc: { type: String },
  iso_estado: { type: String, required: true },
  iso_pais: { type: String, required: true },
});

module.exports = mongoose.model('Address', AddressSchema);