const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CancellationRequestModel = new Schema({
    user_id: { 
        type: mongoose.Types.ObjectId, 
        ref: 'Users', 
        required: true 
    },
    shipment_id: { 
        type: mongoose.Types.ObjectId, 
        ref: 'Shipments',
        required: true 
    },
    motive: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pendiente', 'Aprobado', 'Rechazado'], 
        default: 'Pendiente' 
    },
    rejection_reason: { 
        type: String,
        default: null
    },
    requested_at: { 
        type: Date, 
        default: Date.now 
    },
    resolved_at: { 
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

CancellationRequestModel.pre('save', function(next) {
    if (this.isModified('status') && (this.status === 'Aprobado' || this.status === 'Rechazado')) {
        this.resolved_at = new Date();
    }
    next();
});

module.exports = mongoose.model('Cancellations', CancellationRequestModel);