const LockerModel = require("../models/LockerModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function createLocker(req, res) {
  const {
    id_locker,
    ubication,
    package,
    quant_gabetas,
    lat,
    long,
    status,
    capacity,
    saturation,
    street,
    cp,
    city,
    state,
    country,
    num_ext,
    type,
  } = req.body;
  try {
    const locker = new LockerModel({
        id_locker,
      ubication,
      package,
      quant_gabetas,
      lat,
      long,
      status,
      capacity,
      saturation,
      street,
      cp,
      city,
      state,
      country,
      num_ext,
      type,
    });
    await locker.save();
    return successResponse("Locker creado exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al crear el locker");
  }
}

async function listLockers(req, res) {
  try {
    const lockers = await LockerModel.find();
    return dataResponse(lockers);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener los lockers");
  }
}

async function getLockerById(req, res) {
  const { id } = req.params;
  try {
    const locker = await LockerModel.findById(id);
    return dataResponse(locker);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener el locker");
  }
}

module.exports = {
  createLocker,
    listLockers,
    getLockerById,
};
