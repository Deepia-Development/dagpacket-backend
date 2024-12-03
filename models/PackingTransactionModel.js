const moongose = require('mongoose');


const PackingTransactionModel = new moongose.Schema({
    user_id: { type: moongose.Types.ObjectId, ref: 'Users', required: true },
    sub_user_id: { type: moongose.Types.ObjectId, ref: 'Users' },
    shipment_ids: [{ type: moongose.Types.ObjectId, ref: 'Shipments' }],
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    utility: { type: Number, required: true },
    packing_id: { type: moongose.Types.ObjectId, ref: 'Packing' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = moongose.model('PackingTransaction', PackingTransactionModel);


    