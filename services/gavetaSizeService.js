const GabetaModel = require("../models/GavetaSizeModel");
const GavetaLockerModel = require('../models/GabetaModel')
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function createGavetaSize(req, res) {
  const { size, dimension } = req.body;

  try {
    const gavetaSize = new GabetaModel({
      size,
      dimension,
    });

    await gavetaSize.save();
    return successResponse("Tamaño de gaveta creado correctamente");
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

// Función para convertir la medida a milímetros según el formato
function convertToMillimeters(value) {
  if (typeof value === 'string') {
    // Reemplazar coma por punto para facilitar el parseo
    const normalized = value.replace(',', '.').trim();
    // Si contiene punto decimal, es metros
    if (normalized.includes('.')) {
      return Math.round(parseFloat(normalized) * 1000);
    }
    // Si contiene coma decimal, es metros
    if (value.includes(',')) {
      return Math.round(parseFloat(normalized) * 1000);
    }
    // Si es entero, es centímetros
    if (/^\d+$/.test(normalized)) {
      return Math.round(parseInt(normalized, 10) * 10);
    }
  }
  // Si es número, asumimos centímetros
  if (typeof value === 'number') {
    return Math.round(value * 10);
  }
  return 0;
}

async function getGavetaAvailableForSize(req, res) {
  const { ancho, largo, alto, id } = req.body;

  if (!ancho || !largo || !alto || !id) {
    return errorResponse("Los campos ancho, largo, alto y id son requeridos");
  }

  try {
    // Convertir las medidas recibidas a milímetros según el formato
    const anchoConverted = convertToMillimeters(ancho);
    const largoConverted = convertToMillimeters(largo);
    const altoConverted = convertToMillimeters(alto);

    // Primero buscamos una coincidencia exacta dentro del locker específico
    const exactMatch = await GavetaLockerModel.findOne({
      gabeta_dimension: `${anchoConverted}x${largoConverted}x${altoConverted}`,
      id_locker: id,
      status: true,
      saturation: false,
      type: 'Caja'
    });

    if (exactMatch) {
      return dataResponse(exactMatch);
    }

    // Si no hay coincidencia exacta, buscamos gavetas disponibles en el locker
    const gavetas = await GavetaLockerModel.find({
      id_locker: id,
      status: true,
      saturation: false,
      type: 'Caja'
    });
    
    // Función auxiliar para extraer dimensiones de la cadena "anchoxlargoxalto"
    const getDimensions = (dimensionString) => {
      const [width, length, height] = dimensionString.split('x').map(Number);
      return { width, length, height };
    };

    // Función para verificar si el paquete cabe en la gaveta
    const packageFitsIn = (gavetaDimension) => {
      const gaveta = getDimensions(gavetaDimension);
      const orientations = [
        anchoConverted <= gaveta.width && largoConverted <= gaveta.length && altoConverted <= gaveta.height,
        largoConverted <= gaveta.width && anchoConverted <= gaveta.length && altoConverted <= gaveta.height,
        anchoConverted <= gaveta.width && altoConverted <= gaveta.length && largoConverted <= gaveta.height,
        largoConverted <= gaveta.width && altoConverted <= gaveta.length && anchoConverted <= gaveta.height,
        altoConverted <= gaveta.width && anchoConverted <= gaveta.length && largoConverted <= gaveta.height,
        altoConverted <= gaveta.width && largoConverted <= gaveta.length && anchoConverted <= gaveta.height
      ];
      return orientations.some(fits => fits);
    };

    // Encontrar la gaveta más pequeña donde quepa el paquete
    const suitableGavetas = gavetas
      .filter(gaveta => packageFitsIn(gaveta.gabeta_dimension))
      .sort((a, b) => {
        const volA = getDimensions(a.gabeta_dimension);
        const volB = getDimensions(b.gabeta_dimension);
        return (volA.width * volA.length * volA.height) - 
               (volB.width * volB.length * volB.height);
      });

    if (suitableGavetas.length > 0) {
      return dataResponse(suitableGavetas[0]);
    }

    return errorResponse("No se encontró una gaveta adecuada para este tamaño en el locker especificado");

  } catch (error) {
    console.error("Error al buscar gaveta:", error);
    return errorResponse("Error al buscar gaveta disponible");
  }
}
async function listGavetaSize(req, res) {
  try {
    const gavetaSize = await GabetaModel.find();
    return dataResponse(gavetaSize);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

module.exports = {
  createGavetaSize,
  listGavetaSize,
  getGavetaAvailableForSize,
};
