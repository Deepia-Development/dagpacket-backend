const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  providers: [{
    name: { type: String, required: true },
    services: [{
      idServicio: { type: String, required: true },
      name: { type: String, required: true },
      percentage: { type: Number, required: true },
      status: { type: Boolean, required: true, default: true }
          }]
  }]
});

module.exports = mongoose.model('Service', ServiceSchema);