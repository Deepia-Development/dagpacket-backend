const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletModel = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  sendBalance: {
    type: Schema.Types.Decimal128,
    default: 0.0,
    min: 0
  },
  rechargeBalance: {
    type: Schema.Types.Decimal128,
    default: 0.0,
    min: 0
  },
  servicesBalance: {
    type: Schema.Types.Decimal128,
    default: 0.0,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Wallets', WalletModel);