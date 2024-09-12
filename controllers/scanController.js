// scanService.controller.js
const ScanService = require('../models/scanModel'); // Asegúrate de tener un modelo en mongoose para scan_service

// Función para obtener todos los registros de scan_service
exports.getScans = async (req, res) => {
  try {
    const scans = await ScanService.find(); // Obtener todos los documentos de la colección
    res.status(200).json(scans);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los datos', error });
  }
};

