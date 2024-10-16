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

deleteGaveta = async (req, res) => {
  try {
    // Desestructurar el array de IDs del cuerpo de la solicitud
    const { ids } = req.body; 

    // Validar que se hayan proporcionado IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, "Se debe proporcionar un array de IDs válido");
    }

    // Eliminar las gavetas que coincidan con los IDs
    await GabetaModel.deleteMany({ _id: { $in: ids } });

    return successResponse("Gavetas eliminadas exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse(res, "Error al eliminar las gavetas");
  }
}


async function getAviableGabeta(req, res) {
  try {
    // Obtén el id_locker del request desde los parámetros
    const { id } = req.params; // Extraer id_locker desde el cuerpo de la solicitud

    // Asegúrate de que el idLocker sea una cadena de 24 caracteres
    if (!ObjectId.isValid(id)) {
      return errorResponse("El id_locker proporcionado no es válido");
    }

    // Convierte idLocker a ObjectId
    const objectIdLocker = new ObjectId(id);

    // Busca las gabetas que coincidan con el id_locker y que tengan saturation: false
    const gabetas = await GabetaModel.find({ 
      id_locker: objectIdLocker, // Filtra por id_locker
      saturation: false 
    });

    if (gabetas.length === 0) {
      return errorResponse("No hay gavetas disponibles para el locker especificado");
    }

    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gavetas");
  }
}


// Servicio (maneja la respuesta)
async function recolectPackage(req, res) {
  try {
    if (!req.body.pin) {
      return res.status(400).json({
        success: false,
        message: "El PIN es requerido"
      });
    }

    if (typeof req.body.pin !== 'string' || req.body.pin.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El PIN debe ser una cadena no vacía"
      });
    }

    let gabeta = await GabetaModel.findOne({ pin: req.body.pin });

    if (!gabeta) {
      gabeta = await GabetaModel.findOne({ client_pin: req.body.pin });
    }

    if (gabeta) {
      return res.status(200).json({
        success: true,
        message: "Gaveta encontrada",
        data: gabeta
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No se encontró la gaveta"
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la gaveta"
    });
  }
}


// async function recolectPackage(req,res){

// }

async function updateSaturation(req, res) {
  try {
    // Muestra el body recibido en la consola
    console.log("Datos recibidos en el body:", req.body);

    const { _id, package, saturation } = req.body;
    
    // Verifica que los datos existen en el body
    if (!_id || !package || saturation === undefined) {
      return res.status(400).json({ message: "Faltan datos en la solicitud" });
    }

    // Actualiza los campos 'package' y 'saturation'
    await GabetaModel.updateOne(
      { _id },
      { $set: { package, saturation } }
    );

    // Devuelve una respuesta con los datos recibidos y la actualización
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

async function UpdateGabetaStatus(req, res) {
  try {
    const { _id } = req.params;
    const {  status } = req.body;
    await GabetaModel.updateOne(
      { _id },
      {
        status,
      }
    );
    console.log(_id);
    console.log(status);
    return successResponse("Gaveta actualizada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar la gaveta");
  }
}

getGavetaInfoById = async (req, res) => {
  try {
    const { _id } = req.params;
    const gaveta = await GabetaModel.findById(_id)
    return gaveta;
  }
  catch (error) {
    console.log(error);
    return errorResponse("Error al obtener la gaveta");
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
  UpdateGabetaStatus,
  getGavetaInfoById,
  deleteGaveta,
};
