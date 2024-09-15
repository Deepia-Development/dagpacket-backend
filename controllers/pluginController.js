const DHLService = require('../services/pluginService');
const config = require('../config/config');
const path = require('path');
const fs = require('fs').promises;

const LABEL_URL_BASE = `${config.backendUrl}/labels`;
const LABELS_DIR = path.join(__dirname, '..', 'public', 'labels');

exports.getQuote = async (req, res) => {
  try {
    const quoteData = {
      pais_origen: req.body.pais_origen,
      pais_destino: req.body.pais_destino,
      cp_origen: req.body.cp_origen,
      cp_destino: req.body.cp_destino,
      alto: req.body.alto,
      ancho: req.body.ancho,
      largo: req.body.largo,
      peso: req.body.peso,
      seguro: req.body.seguro,
      valor_declarado: req.body.valor_declarado
    };

    // Validación de datos
    const requiredFields = ['pais_origen', 'pais_destino', 'cp_origen', 'cp_destino', 'alto', 'ancho', 'largo', 'peso'];
    for (let field of requiredFields) {
      if (quoteData[field] === undefined) {
        return res.status(400).json({
          error: 'Datos de cotización incompletos',
          details: `El campo ${field} es requerido`
        });
      }
    }

    const quoteResult = await DHLService.getQuote(quoteData);

    if (!quoteResult || quoteResult.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron cotizaciones disponibles',
        details: 'DHL no devolvió cotizaciones para los parámetros proporcionados'
      });
    }

    res.json({ dhl: { success: true, data: { paqueterias: quoteResult } } });
  } catch (error) {
    console.error('Error en dhlController.getQuote:', error);
    res.status(500).json({ 
      error: 'Error al obtener las cotizaciones', 
      details: error.message 
    });
  }
};

exports.generateGuide = async (req, res) => {
  try {
    const shipmentData = req.body;
    
    const guideResponse = await DHLService.createShipment(shipmentData);
    const standardizedResponse = standardizeDHLResponse(guideResponse);

    // Manejo especial para guardar la etiqueta
    if (standardizedResponse.success && standardizedResponse.data.pdfBuffer) {
      const pdfBuffer = Buffer.from(standardizedResponse.data.pdfBuffer, 'base64');
      const fileName = `${standardizedResponse.data.guideNumber}.pdf`;
      const labelPath = path.join(LABELS_DIR, fileName);

      // Asegurarse de que el directorio existe
      await fs.mkdir(LABELS_DIR, { recursive: true });

      // Guardar el archivo
      await fs.writeFile(labelPath, pdfBuffer);
      console.log(`Etiqueta guardada en: ${labelPath}`);

      standardizedResponse.data.guideUrl = `${LABEL_URL_BASE}/${fileName}`;
      delete standardizedResponse.data.pdfBuffer; // Eliminamos el buffer de la respuesta
    }

    res.json(standardizedResponse);
  } catch (error) {
    console.error('Error en dhlController.generateGuide:', error);
    res.status(500).json({ 
      error: 'Error al generar la guía', 
      details: error.message 
    });
  }
};

function standardizeDHLResponse(originalResponse) {
  if (originalResponse.success) {
    return {
      success: true,
      message: "Guía generada exitosamente",
      data: {
        provider: 'dhl',
        guideNumber: originalResponse.data.guideNumber,
        guideUrl: `${LABEL_URL_BASE}/${originalResponse.data.guideNumber}.pdf`,
        trackingUrl: originalResponse.data.trackingUrl,
        labelType: "PDF",
        additionalInfo: {
          packages: originalResponse.data.packages,
          shipmentTrackingNumber: originalResponse.data.shipmentTrackingNumber
        },
        pdfBuffer: originalResponse.data.pdfBuffer
      }
    };
  } else {
    return {
      success: false,
      message: "Error al generar la guía con DHL",
      error: originalResponse.error || "Error desconocido"
    };
  }
}

module.exports = {
  getQuote: exports.getQuote,
  generateGuide: exports.generateGuide
};