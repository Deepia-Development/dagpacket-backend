const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleModel = new Schema({
    role_name: { type: String, required: true },
    has_wallet: { type: String, required: true },
    type: { type: String, required: true, default: 'N/A' }        
})

module.exports = mongoose.model('Role', RoleModel);