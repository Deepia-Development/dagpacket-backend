const mongoose = require('mongoose');
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
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('RechargeRequest', RechargeRequestSchema);