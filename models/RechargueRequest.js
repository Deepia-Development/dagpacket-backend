const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const RechargeRequestSchema = new Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  amount: {
    type: Schema.Types.Decimal128, 
    default: 0.0, 
    min: 0 
  },  
  paymentMethod: {
    type: String,
    enum: ['transferencia'],
    default: 'transferencia'
  },
  proofImage: {
    type: Buffer,
    required: true
  },
  status: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  approvedBy: {
    name: { type: String }, 
    surname: { type: String },
    email: { type: String }
  },

  notes: String,
  rechargeType: {
    type: String,
    enum: ['envios', 'servicios', 'recargas'],
    required: true
  }
}, {
  timestamps: true
});

RechargeRequestSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('RechargeRequest', RechargeRequestSchema);