const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserPackingInventoryModel = new Schema({
    user_id: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
    inventory: [{
        packing_id: { type: mongoose.Types.ObjectId, ref: 'Packing', required: true },
        quantity: { type: Number, default: 0, min: 0 },
        last_restock_date: { type: Date, default: Date.now }
    }]
});

UserPackingInventoryModel.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('UserPackingInventory', UserPackingInventoryModel);