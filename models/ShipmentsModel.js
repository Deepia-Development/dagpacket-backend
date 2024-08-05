const mongoose = require('mongoose');
const AutoIncrementFactory = require('mongoose-sequence');
const Schema = mongoose.Schema;
const AutoIncrement = AutoIncrementFactory(mongoose);
const TrackingModel = require('../models/TrackingModel');

const ShipmentsModel = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'Users' },
  distribution_at: { type: Date, default: () => {
    const now = new Date();
    const utcOffset = -6; // UTC-6
    const adjustedDate = new Date(now.getTime() + utcOffset * 60 * 60 * 1000);
    return adjustedDate;
  }},
  shipment_type: { type: String, enum: ['Paquete', 'Sobre'], default: 'Sobre' },
  from: {
    name: { type: String, required: true},
    phone: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    conutry_code: { type: String, required: true, default: 'MX' },
    settlement: { type: String, required: true },
    zip_code: { type: String, required: true },    
    external_number: { type: String, required: true },
    internal_number: { type: String },
    reference: { type: String },    
    rfc: { type: String, required: false },
    iso_estado: { type: String, required: true },
    iso_pais: { type: String, required: true },        

  },
  to: {
    name: { type: String, required: true},
    phone: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    conutry_code: { type: String, required: true, default: 'MX' },
    settlement: { type: String, required: true },
    zip_code: { type: String, required: true },    
    external_number: { type: String, required: true },
    internal_number: { type: String },
    reference: { type: String },    
    rfc: { type: String, required: false },
    iso_estado: { type: String, required: true },
    iso_pais: { type: String, required: true },        
  },
  payment: {
    method: { type: String, enum: ['saldo', 'efectivo', 'td-credito', 'td-debito', 'clip'], required: true },
    status: { type: String, enum: ['Pendiente', 'Pagado', 'Reembolsado', 'Cancelado'], default: 'Pendiente' },
    transaction_id: { type: String, default: `ID-${Date.now()}` },
    clip_transaction_id: { type: String }
  },
  packing: { 
      answer: { type: String, default: 'No'},
      packing_id: { type: mongoose.Types.ObjectId, ref: 'Packing' },
      packing_type: { type: String, default: 'None' },
      packing_cost: { type: Schema.Types.Decimal128, default: 0.0, min: 0  } 
   },
   shipment_data: {
    height: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    length: { type: Number, required: true, min: 0 },
    package_weight: { type: Number, required: true, min: 0 },
    volumetric_weight: { type: Number, min: 0 }
  },
  insurance: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  cost: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  price: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  extra_price: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  discount: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  status: { type: String, enum: ['Entregado', 'En recolección', 'Enviado', 'Problema', 'Cancelado', 'En reparto'], default: 'En recolección' },  
  dagpacket_profit: { type: Schema.Types.Decimal128, default: 0.0, min: 0},  
  description: { type: String, required: false },
  provider: { type: String },
  idService: { type: String, required: true},
  guide: { type: String },
  receipt: { type: String },
  guide_number: { type: String },
  trackingNumber: { type: Number, unique: true }
}, { timestamps: true });

ShipmentsModel.pre('save', async function (next) {
  try {    
    if (this.shipment_data.height && this.shipment_data.width && this.shipment_data.length) {
      const volumetric_factor = 5000; 
      const volume = this.shipment_data.height * this.shipment_data.width * this.shipment_data.length;
      this.shipment_data.volumetric_weight = volume / volumetric_factor;
    }
    next();
  } catch (error) {
    next(error);
  }
});

ShipmentsModel.post('save', async function (doc, next) {
  try {    
    const existingTracking = await TrackingModel.findOne({
      shipment_id: doc._id,
      title: 'Envío creado'
    });    
    if (!existingTracking) {
      const trackingData = {
        shipment_id: doc._id,
        title: 'Envío creado',      
        area: doc.from.city,
        description: 'El envío ha sido creado exitosamente.'
      };
      await TrackingModel.create(trackingData);
    }   
    next();
  } catch (error) {
    next(error);
  }
});


ShipmentsModel.plugin(AutoIncrement, { inc_field: 'trackingNumber' });
module.exports = mongoose.model('Shipments', ShipmentsModel);