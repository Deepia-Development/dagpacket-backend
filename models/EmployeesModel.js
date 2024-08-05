const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeesModel = new Schema({
    user_id: { type: mongoose.Types.ObjectId, ref: 'Users' },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'CAJERO' }
});

module.exports = mongoose.model('Employee', EmployeesModel);