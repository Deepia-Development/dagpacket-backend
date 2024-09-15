const scanService = require('../services/scanService');  
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

const scanController = {

  async getAllScans(req, res) {
    try {
      const scans = await scanService.getAllScan();  
      if (!scans || scans.length === 0) {
        return res.status(200).json({ message: 'No hay escaneos disponibles', data: [] });  
      }
      res.status(200).json({ message: 'Todos los escaneos obtenidos exitosamente', data: scans });  
    } catch (error) {
      res.status(400).json({ message: 'Error al obtener los escaneos: ' + error.message });
    }
  }
};

module.exports = scanController;


