const mongoose = require('mongoose');
const AutoIncrementFactory = require('mongoose-sequence');
const Schema = mongoose.Schema;
const AutoIncrement = AutoIncrementFactory(mongoose);
const TrackingModel = require('../models/TrackingModel');

const ShipmentsModel = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'Users' },
  distribution_at: { type: Date },
  shipment_type: { type: String, enum: ['Paquete', 'Sobre'], default: 'Sobre' },
  from: {
    name: { type: String, required: true},
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zip_code: { type: String, required: true },
    municipality: { type: String, required: true },
    external_number: { type: String, required: true },
    internal_number: { type: String, required: true },
    reference: { type: String }
  },
  to: {
    name: { type: String, required: true},
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zip_code: { type: String, required: true },
    municipality: { type: String, required: true },
    external_number: { type: String, required: true },
    internal_number: { type: String, required: true },
    reference: { type: String }
  },
  payment_method: { type: String, required: true },
  packing: { type: String, default: 'No' },
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
  status: { type: String, enum: ['Entregado', 'En recolección', 'Enviado', 'Problema'], default: 'En recolección' },
  licensee_percentage: { type: Number, default: 0, min: 0, max: 100 },
  licensee_profit: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  license_seller_profit: { type: Schema.Types.Decimal128, default: 0.0, min: 0 },
  payment_status: { type: String, enum: ['Pendiente', 'Pagado', 'Reembolsado'], default: 'Pendiente' },
  trackingNumber: { type: Number, unique: true }
});

ShipmentsModel.pre('save', async function (next) {
  try {
    if (this.price && this.cost && this.licensee_percentage) {
      const percentage = this.licensee_percentage / 100;
      this.license_seller_profit = this.price - this.cost;
      this.licensee_profit = this.license_seller_profit * percentage;
    }

    //Calcular perso volumetrico 
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
    const trackingData = {
      shipment_id: doc._id,
      title: 'Envío creado',
      date: new Date(),
      area: this.from.city,
      description: 'El envío ha sido creado exitosamente.'
    };

    await TrackingModel.create(trackingData);
    next();
  } catch (error) {
    next(error);
  }
});

ShipmentsModel.plugin(AutoIncrement, { inc_field: 'trackingNumber' });

module.exports = mongoose.model('Shipments', ShipmentsModel);