const scanService = require('../services/ScanService');
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
  },

  async updateBarcode(req, res) {
    try {
      const { id } = req.params;  
      const { barcode } = req.body;  

      if (!barcode || barcode.length !== 18) {
        return res.status(400).json({ message: 'El código de barras debe tener 18 caracteres' });
      }

      const updatedScan = await scanService.updateBarcode(id, barcode);  
      if (!updatedScan) {
        return res.status(404).json({ message: 'Escaneo no encontrado' });
      }

      res.status(200).json({ message: 'Código de barras actualizado exitosamente', updatedScan });
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el código de barras: ' + error.message });
    }
  },

  async createBarcode(req, res) {
    try {
      const { name, barcode } = req.body;
  
      if (!barcode || barcode.length !== 18) {
        return res.status(400).json({ message: 'El código de barras debe tener 18 caracteres' });
      }
  
      console.log('Datos recibidos:', { name, barcode }); // Para ver los datos recibidos en la terminal
  
      // Usamos el servicio para crear un nuevo código de barras
      const newScan = await scanService.createBarcode({ name, barcode });
  
      res.status(201).json({ message: 'Código de barras guardado exitosamente', data: newScan });
    } catch (error) {
      console.error('Error al guardar el código de barras:', error); // Mostrar el error en el servidor
      res.status(500).json({ message: 'Error al guardar el código de barras: ' + error.message });
    }
  }
  

};

module.exports = scanController;
