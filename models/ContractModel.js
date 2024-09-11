const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractModel = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  type: {
    type: String,
    enum: ['INMEDIATA', 'TRADICIONAL'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  }  
}, { timestamps: true });

module.exports = mongoose.model('Contracts', ContractModel);