/*const ScanService = require('../models/scanModel');

exports.getScans = async (req, res) => {
  try {
    const scans = await ScanService.find();
    console.log('Datos obtenidos de MongoDB:', scans);  // Verifica los datos
    res.status(200).json(scans);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ message: 'Error al obtener los datos', error });
  }
};
*/



const scanService = require('../services/scanService');  // Asegúrate de que el servicio esté bien importado
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

const scanController = {
  // Controlador para obtener todos los escaneos
  async getAllScans(req, res) {
    try {
      const scans = await scanService.getAllScan();  // Llamada al servicio para obtener todos los escaneos
      if (!scans || scans.length === 0) {
        return res.status(200).json(dataResponse('No hay escaneos disponibles', []));  // Si no hay escaneos, devolver un array vacío
      }
      res.status(200).json(dataResponse('Todos los escaneos obtenidos exitosamente', scans));  // Enviar los datos
    } catch (error) {
      res.status(400).json(errorResponse('Error al obtener los escaneos: ' + error.message));
    }
  }
};

module.exports = scanController;

