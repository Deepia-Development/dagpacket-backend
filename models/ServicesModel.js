const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServicesModel = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'Users' },
    service: { type: String },
    date: { type: date },
    reference_number: { type: String },
    auth_number: { type: String },
    mount: { type: String },    
    licensee_profit: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
    licensee_seller_profit: { type: Schema.Types.Decimal128, default: 0.0, min: 0},
    status: { type: String }
});


module.exports = mongoose.model('Services', ServicesModel);
