const GabetaModel = require("../models/GabetaModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const { ObjectId } = require("mongoose").Types;

function generateRandomPin(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

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

  // Generar PIN y client PIN automáticamente
  const pin = generateRandomPin(10);
  const client_pin = generateRandomPin(10);

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
      pin, // Agregar pin generado
      client_pin, // Agregar client_pin generado
    });

    await gabeta.save();
    return successResponse("Gaveta creada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al crear la gaveta");
  }
}

async function listGabetas(req, res) {
  try {
    const gabetas = await GabetaModel.find();
    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gavetas");
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
    res.status(500).json({ message: "Error al obtener las gavetas" }); // Respuesta de error
  }
}

async function getAviableGabeta(req, res) {
  try {
    const gabetas = await GabetaModel.find({ saturation: false });

    if (gabetas.length === 0) {
      return errorResponse("No hay gavetas disponibles");
    }

    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gavetas");
  }
}

async function recolectPackage(req, res) {
  try {
    const gabeta = await GabetaModel.findOne({ pin: req.body.pin });

    const gabetaCliente = await GabetaModel.findOne({
      client_pin: req.body.pin,
    });

    if (gabeta) {
      return json
        .status(200)
        .json({ success: true, message: "Gaveta encontrada", data: gabeta });
    } else if (gabetaCliente) {
      return dataResponse(gabetaCliente);
    } else {
      return errorResponse("No se encontro la gaveta");
    }
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener la gaveta");
  }
}

async function updateSaturation(req, res) {
  try {
    const { _id, saturation } = req.body;
    await GabetaModel.updateOne({ _id }, { saturation });
    return successResponse("Gaveta actualizada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar la gaveta");
  }
}

async function UpdateGabeta(req, res) {
  try {
    const { _id, saturation } = req.body;
    await GabetaModel.updateOne({ _id }, { saturation });
    return successResponse("Gaveta actualizada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar la gaveta");
  }
}

module.exports = {
  createGabeta,
  listGabetas,
  getGabetaByIdLocker,
  getAviableGabeta,
  recolectPackage,
  updateSaturation,
  UpdateGabeta,
};
