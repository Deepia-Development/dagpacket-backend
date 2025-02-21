const CuponModel = require("../models/CuponModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
async function createCupon(req) {
  try {
    const {
      user_id,
      code,
      type,
      type_value,
      value,
      quantity,
      is_unlimited,
      start_date,
      end_date,
      status,
      description,
    } = req.body;
    console.log(req.body);
    if (is_unlimited && quantity) {
      return errorResponse(
        "No se puede tener cantidad y ser ilimitado al mismo tiempo"
      );
    }

    if (type_value !== "Porcentaje" && type_value !== "Numero") {
      return errorResponse("El tipo de valor debe ser Porcentaje o Numero");
    }

    if (
      type !== "Cupon Dagpacket" &&
      type !== "Cupon Licenciatario" &&
      type !== "Cupon Compuesto"
    ) {
      return errorResponse(
        "El tipo de cupón debe ser Cupon Dagpacket, Cupon Licenciatario o Cupon Compuesto"
      );
    }

    const cupon = new CuponModel({
      user_id,
      code,
      type,
      type_value,
      value,
      quantity,
      is_unlimited,
      start_date,
      end_date,
      status,
      description,
    });

    if (!cupon) {
      return errorResponse("No se pudo crear el cupón");
    }

    console.log(cupon);

    await cupon.save();

    return successResponse("Cupón creado correctamente");
  } catch (error) {
    console.error("Error al crear el cupón:", error);
    return errorResponse("Ocurrió un error al crear el cupón");
  }
}

async function getAllCupon(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query; // Obtener parámetros de paginación
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Consultar los cupones con paginación y populate
    const cupones = await CuponModel.find()
      .populate({
        path: "user_id",
        select: "name email", // Campos específicos del usuario
        model: "Users",
      })
      .sort({ start_date: -1 }) // Ordenar por fecha de inicio descendente
      .skip(skip)
      .limit(limitNumber);

    // Contar el total de cupones
    const total = await CuponModel.countDocuments();
    const totalPages = Math.ceil(total / limitNumber);

    // Validar si se encontraron cupones
    if (!cupones.length) {
      return errorResponse("No se encontraron cupones");
    }

    // Responder con los datos paginados
    return dataResponse({
      cupones,
      total,
      totalPages,
      currentPage: pageNumber,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    });
  } catch (error) {
    console.error("Error al obtener los cupones:", error);
    return errorResponse("Ocurrió un error al obtener los cupones");
  }
}

async function getCuponById(req) {
  try {
    const { id } = req.params;

    const cupon = await CuponModel.findById(id);

    if (!cupon) {
      return errorResponse("No se encontró el cupón");
    }

    return dataResponse(cupon);
  } catch (error) {
    return errorResponse("Ocurrió un error al obtener el cupón");
  }
}

async function getCuponByUserId(req) {
  try {
    const { user_id } = req.params;

    const cupones = await CuponModel.find({ user_id });

    if (!cupones) {
      return errorResponse("No se encontraron cupones");
    }

    return dataResponse(cupones);
  } catch (error) {
    return errorResponse("Ocurrió un error al obtener los cupones");
  }
}

async function updateCupon(req) {
  try {
    const { id } = req.params;
    const {
      user_id,
      type,
      type_value,
      value,
      quantity,
      is_unlimited,
      start_date,
      end_date,
      status,
      description,
    } = req.body;

    const cupon = await CuponModel.findByIdAndUpdate(
      id,
      {
        type,
        type_value,
        value,
        quantity,
        is_unlimited,
        start_date,
        end_date,
        status,
        description,
      },
      { new: true }
    );

    if (!cupon) {
      return errorResponse("No se encontró el cupón");
    }

    return successResponse("Cupón actualizado correctamente");
  } catch (error) {
    return errorResponse("Ocurrió un error al actualizar el cupón");
  }
}

async function changeCuponStatus(req) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const cupon = await CuponModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!cupon) {
      return errorResponse("No se encontró el cupón");
    }

    return successResponse("Estado del cupón actualizado correctamente");
  } catch (error) {
    return errorResponse("Ocurrió un error al cambiar el estado del cupón");
  }
}

async function getCuponByCode(req) {
  try {
    const { code } = req.params;
    const { userId } = req.query; // Obtenemos el userId de los query params
    const currentDate = new Date();

    const query = {
      code: { $regex: code, $options: "i" },
      status: true,
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate },
      $or: [{ is_unlimited: true }, { quantity: { $gt: 0 } }],
    };

    // Agregamos el filtro de userId solo si viene en la query
    if (userId) {
      query.user_id = userId;
    }

    const cupones = await CuponModel.find(query).sort({ value: -1 });

    if (!cupones || cupones.length === 0) {
      return successResponse("No se encontraron cupones", {
        total_cupones: 0,
        cupones: [],
      });
    }

    return dataResponse("Cupones encontrados", {
      total_cupones: cupones.length,
      cupones,
    });
  } catch (error) {
    console.error("Error al obtener los cupones:", error);
    return errorResponse("Ocurrió un error al obtener los cupones");
  }
}
module.exports = {
  createCupon,
  getAllCupon,
  getCuponById,
  getCuponByUserId,
  updateCupon,
  changeCuponStatus,
  getCuponByCode,
};
