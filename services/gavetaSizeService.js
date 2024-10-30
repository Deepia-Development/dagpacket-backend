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

async function getGavetaAvailableForSize(req, res) {
  const { ancho, largo, alto, id } = req.body;

  if (!ancho || !largo || !alto || !id) {
    return errorResponse("Los campos ancho, largo, alto y id son requeridos");
  }

  try {
    // Primero buscamos una coincidencia exacta dentro del locker específico
    const exactMatch = await GavetaLockerModel.findOne({
      gabeta_dimension: `${ancho}x${largo}x${alto}`,
      id_locker: id,
      status: true,
      saturation: false
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
      
      // Verificamos todas las posibles orientaciones del paquete
      const orientations = [
        // Normal
        ancho <= gaveta.width && largo <= gaveta.length && alto <= gaveta.height,
        // Rotado 90 grados en el plano horizontal
        largo <= gaveta.width && ancho <= gaveta.length && alto <= gaveta.height,
        // De lado
        ancho <= gaveta.width && alto <= gaveta.length && largo <= gaveta.height,
        // Rotado 90 grados y de lado
        largo <= gaveta.width && alto <= gaveta.length && ancho <= gaveta.height,
        // De pie
        alto <= gaveta.width && ancho <= gaveta.length && largo <= gaveta.height,
        // De pie y rotado 90 grados
        alto <= gaveta.width && largo <= gaveta.length && ancho <= gaveta.height
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
