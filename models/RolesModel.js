const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleModel = new Schema({
    role: { type: String, required: true },
    description: { type: String }    
})

module.exports = mongoose.model('Role', RoleModel);