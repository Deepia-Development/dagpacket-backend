const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const RefillRequestSchema = new Schema({
    user_id: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
    packing_id: { type: mongoose.Types.ObjectId, ref: 'Packing', required: true },
    quantity_requested: { type: Number, required: true, min: 1 },
    status: { 
        type: String, 
        enum: ['pendiente', 'aprobada', 'rechazada'],
        default: 'pendiente'
    },
    request_date: { type: Date, default: Date.now },
    processed_date: { type: Date },
    admin_notes: { type: String },
    user_notes: { type: String }
}, { timestamps: true });

RefillRequestSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('RefillRequest', RefillRequestSchema);