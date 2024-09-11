const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerModel = new Schema({
    name: { type: String, reuqired: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }    
})

module.exports = mongoose.model('Customers', CustomerModel)