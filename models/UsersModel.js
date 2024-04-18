const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserModel = new Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zip_code: String,
    external_number: String,
    internal_number: String,
    settlement: String,
    municipality: String,
  },
  email: { type: String, required: true },
  balance: {
    type: Schema.Types.Decimal128,
    default: 0.0,
    min: 0,
  },
  password: { type: String, required: true },
  pin: { type: String },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role'    
  },
  active: { type: Boolean, default: false   }
}, { timestamps: true });


module.exports = mongoose.model('Users', UserModel);