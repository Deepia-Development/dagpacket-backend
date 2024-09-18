const Scan = require('../models/scanModel');

const scanService = {
  async getAllScan() {
    try {
      return await Scan.find();
    } catch (error) {
      console.error('Error al obtener los escaneos:', error);
      throw new Error('Error al obtener los escaneos');
    }
  },

  // NUEVO: Servicio para actualizar el código de barras
  async updateBarcode(id, barcode) {
    return await Scan.findByIdAndUpdate(id, { barcode: barcode }, { new: true });
  }
};

module.exports = scanService;
