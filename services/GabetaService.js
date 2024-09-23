const GabetaModel = require("../models/GabetaModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const { ObjectId } = require("mongoose").Types;
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
    saturation,
    type,
    gabeta_dimension,
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
      saturation,
      type,
      gabeta_dimension,
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

async function getGabetaByIdLocker(req, res) {
  const { id_locker } = req.body; // Usar req.body para obtener id_locker
  try {
    // Busca las gabetas utilizando el ObjectId
    const gabetas = await GabetaModel.find({
      id_locker: new ObjectId(id_locker),
    });

    // Devuelve la respuesta con los datos obtenidos
    res.status(200).json(gabetas); // Respuesta exitosa con los datos
  } catch (error) {
    console.error(error); // Log del error
    res.status(500).json({ message: "Error al obtener las gabetas" }); // Respuesta de error
  }
}

async function getAviableGabeta(req, res) {
  try {
    const gabetas = await GabetaModel.find({ saturation: true });

    if (gabetas.length === 0) {
      return errorResponse("No hay gabetas disponibles");
    }

    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gabetas");
  }
}

module.exports = {
  createGabeta,
  listGabetas,
  getGabetaByIdLocker,
  getAviableGabeta,
};
