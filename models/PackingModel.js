    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    const PackingModel = new Schema({
        image: { type: Buffer, required: true },
        name: { type: String, required: true },
        sell_price: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
        cost_price: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
        type: { type: String, required: true },
        weigth: { type: Number },
        height: { type: Number },
        width: { type: Number },
        length: { type: Number },
        description: { type: String, required: true }
    });

    module.exports = mongoose.model('Packing', PackingModel);
