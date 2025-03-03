const moongose = require('mongoose');
const Schema = moongose.Schema;

const StockSchema = new Schema({
    packing: { type: Schema.Types.ObjectId, ref: 'Packing', required: true },
    quantity: { type: Number, required: true },
    last_entry: { type: Date, default: Date.now },
    last_output: { type: Date },
});

const WareHouseSchema = new Schema({
    name: { type: String, required: true },
    stock: [StockSchema],
});

module.exports = moongose.model('Warehouse', WareHouseSchema);


