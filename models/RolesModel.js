const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleModel = new Schema({
    roleName: { type: String, required: true },
    permissiones: { type: String, required: true },           
})

module.exports = mongoose.model('Role', RoleModel);