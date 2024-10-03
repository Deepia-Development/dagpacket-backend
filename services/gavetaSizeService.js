const GabetaModel = require("../models/GavetaSizeModel");

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
    return successResponse('Tamaño de gaveta creado correctamente');
  } catch (error) {
    return errorResponse(res, error.message);
  }
}




async function listGavetaSize(req, res) {
    try {
        const gavetaSize = await GabetaModel.find();
        return dataResponse( gavetaSize);
    } catch (error) {
        return errorResponse(res, error.message);
    }
}

module.exports = {
    createGavetaSize,
    listGavetaSize  
}