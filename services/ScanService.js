const Scan = require('../models/scanModel');

const scanService = {
  
  async getAllScan() {
    return await Scan.find();
  },

  async updateBarcode(id, barcode) {
    return await Scan.findByIdAndUpdate(id, { barcode }, { new: true });
  },

 
  async createBarcode({ name, barcode }) {
    try {
      console.log("Intentando guardar en la base de datos:", { name, barcode }); // Log antes de guardar
      const newScan = new Scan({
        name: name || 'Producto sin nombre',
        barcode
      });
      const savedScan = await newScan.save();
      console.log("Guardado exitosamente:", savedScan); // Log después de guardar exitosamente
      return savedScan;
    } catch (error) {
      console.error('Error en el servicio createBarcode:', error); // Log en caso de error
      throw new Error('Error al guardar el código de barras en la base de datos');
    }
  }
  
  

};

module.exports = scanService;