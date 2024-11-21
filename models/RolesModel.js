const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleModel = new Schema({
    role_name: { type: String, required: true },
    has_wallet: { type: String, required: true },
    type: { type: String, required: true },
    permissions: { type: Object, required: false } // Cambiado de Array a Object
});

module.exports = mongoose.model('Role', RoleModel);
