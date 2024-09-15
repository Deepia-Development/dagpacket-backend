
  const Scan = require('../models/scanModel');

  const scanService = {
    async getAllScan() {
      try {
        return await Scan.find();  
      } catch (error) {
        console.error('Error al obtener los escaneos:', error);
        throw new Error('Error al obtener los escaneos');
      }
    }
  };
  
  module.exports = scanService;
  


