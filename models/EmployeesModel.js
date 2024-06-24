const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeesModel = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    phone: { type: String, required: true },
    role_id: { type: String, required: true },
    kpis: {
        salesAmount: { type: Number, default: 0 },
        transactionsCount: { type: Number, default: 0 },
        averageTransactionValue: { type: Number, default: 0 },
        upsellRate: { type: Number, min: 0, max: 100, default: 0 },
        cashierAccuracy: { type: Number, min: 0, max: 100, default: 100 },
    },
    kpiHistory: [{
        date: { type: Date, default: Date.now },
        kpis: {
            salesAmount: Number,
            transactionsCount: Number,
            averageTransactionValue: Number,
            upsellRate: Number,
            cashierAccuracy: Number,
        }
    }]
});

module.exports = mongoose.model('Employee', EmployeesModel);