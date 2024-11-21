const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  image64: { type: Schema.Types.Mixed, required: false }, // Permite Buffer o String
  url: { type: String, required: false },
    alt: { type: String }
  });

const AdvertisementSchema = new Schema({
    enterprise: { type: String, required: true },
    type: { type: String, enum: ['digital', 'print'], required: true },
    duration: { type: Number, min: 20, max: 30, required: true },
    income: { type: Number, required: true },
    description: { type: String, required: true },
    contract: {
      file64: { type: Buffer, required: false },
      url: { type: String, required: false }
    },
    images: [ImageSchema],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  }, { timestamps: true });
  
const PublicityModel = new Schema({
    locker_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'lockers', 
      required: true 
    },
    advertisements: [AdvertisementSchema]
  }, { 
    timestamps: true,
    versionKey: false
  });

module.exports = mongoose.model('locker_publicity', PublicityModel);