const LockerModel = require("../models/LockerModel");
const GabetaModel = require("../models/GabetaModel");
const TrackingModel = require('../models/TrackingModel')
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

async function updateStatusLocker(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const locker = await LockerModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return dataResponse(locker);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar el locker");
  }
}

async function verifyLockerStatus(req, res) {
  try {
    const { id } = req.body;
    const locker = await LockerModel.findById(id);
    if (locker.status === true) {
      return {
        status: true,
      };
    }
    return {
      status: false,
    };
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getLockerWithGavetasWithPackage(req, res) {
  try {
    // 1. Obtener el último estado de cada envío
    const lastTrackingStatuses = await TrackingModel.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$shipment_id',
          latestStatus: { $first: '$$ROOT' }
        }
      }
    ]);
 
    // 2. Obtener las gavetas con paquetes
    const gabetas = await GabetaModel.find({
      package: { $exists: true, $ne: null }
    }).populate("package");
 
    // 3. Obtener los IDs de los lockers
    const lockerIds = gabetas.map(g => g.id_locker);
 
    // 4. Obtener los lockers correspondientes
    const lockers = await LockerModel.find({
      _id: { $in: lockerIds }
    });
 
    // 5. Combinar la información
    const lockersConGabetas = lockers.map((locker) => {
      const gabetasConPaquete = gabetas.filter(
        (gabeta) => 
          gabeta.id_locker.toString() === locker._id.toString() &&
          gabeta.package
      ).map(gabeta => {
        // Encontrar el último estado del envío para este paquete
        const trackingStatus = lastTrackingStatuses.find(
          status => status._id?.toString() === gabeta.package?._id?.toString()
        )?.latestStatus;
 
        return {
          ...gabeta.toObject(),
          tracking: trackingStatus
        };
      });
 
      return {
        ...locker.toObject(),
        gabetas: gabetasConPaquete
      };
    });
 
    return dataResponse("Lockers con gabetas y paquetes", lockersConGabetas);
  } catch (error) {
    console.error(error);
    return errorResponse("Error al obtener los lockers");
  }
 }


async function editLocker(req, res) {
  const { id } = req.params;
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
    const locker = await LockerModel.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true }
    );
    return dataResponse(locker);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al editar el locker");
  }
}

module.exports = {
  updateStatusLocker,
  createLocker,
  listLockers,
  getLockerById,
  verifyLockerStatus,
  editLocker,
  getLockerWithGavetasWithPackage,
};
