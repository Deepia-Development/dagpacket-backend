const moongose = require('mongoose');

const recharguesInvoiceSchema = new moongose.Schema({
    invoiceNo: { type: Number, required: true },    
    });



module.exports = moongose.model('RecharguesInvoice', recharguesInvoiceSchema);