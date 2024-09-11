const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserModel = new Schema({
  image: { type: Buffer },
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
  wallet: { type: Schema.Types.ObjectId, ref: 'Wallets' },
  password: { type: String, required: true },
  pin: { type: String, default: '' },
  role: {
    type: String,
    default: 'LICENCIATARIO_TRADICIONAL'  
  },
  parentUser: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    default: null
  },
  dagpacketPercentaje: { 
    type: Schema.Types.Decimal128, 
    default: 30.0,
    min: 0
  },
  servicesPercentaje: { 
    type: Schema.Types.Decimal128, 
    default: 30.0,
    min: 0
  },
  recharguesPercentage: {
    type: Schema.Types.Decimal128,
    default: 30.0,
    min: 0
  },
  packingPercentage: {
    type: Schema.Types.Decimal128,
    default: 30.0,
    min: 0
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  active: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Users', UserModel);