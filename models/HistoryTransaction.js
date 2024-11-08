const mongoose = require('mongoose');

const HistoryTransactionSchema = new mongoose.Schema({
    service: { type: String, required: true },
    description: { type: String, required: true },
    message: { type: String, required: true },
    amount: { type: Number, required: true },
    previous_balance: { type: Number, required: true },
    new_balance: { type: Number, required: true },
    user_id: { type: mongoose.Types.ObjectId, required: true },
    user_type: { type: String, required: true, enum: ['users', 'customers'] },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HistoryTransaction', HistoryTransactionSchema);


