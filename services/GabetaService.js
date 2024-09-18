const GabetaModel = require("../models/GabetaModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function createGabeta(req, res) {
  const {
    id_locker,
    id_gabeta,
    size,
    weight,
    package,
    status,
    ubication,
    street,
    cp,
    city,
    state,
    country,
  } = req.body;
  try {
    const gabeta = new GabetaModel({
      id_locker,
      id_gabeta,
      size,
      weight,
      package,
      status,
      ubication,
      street,
      cp,
      city,
      state,
      country,
    });
    await gabeta.save();
    return successResponse("Gabeta creada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al crear la gabeta");
  }
}

async function listGabetas(req, res) {
  try {
    const gabetas = await GabetaModel.find();
    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gabetas");
  }
}

module.exports = {
  createGabeta,
  listGabetas,
};
