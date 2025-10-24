const TransactionModel = require("../models/TransactionsModel");
const ShipmentsModel = require("../models/ShipmentsModel.js");
const PackingTransactionModel = require("../models/PackingTransactionModel.js");

const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const mongoose = require("mongoose");

async function getAll(req, res) {
  try {
    const transactions = await TransactionModel.find();
    return dataResponse(transactions);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las transacciones");
  }
}

async function getReciptById(req, res) {
  try {
    const { id } = req.params;
    const transaction = await TransactionModel.findById(id).select("receipt");

    if (!transaction) {
      return errorResponse("Transacción no encontrada");
    }

    const receipt = transaction.receipt.toString("base64"); // Convertir el buffer a base64
    return successResponse({ receipt });
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener el recibo de la transacción");
  }
}

async function getByUser(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query; // Parámetros de paginación

    const transactions = await TransactionModel.find({ user_id: id })
      .sort({ createdAt: -1 }) // Ordenar por fecha descendente
      .skip((page - 1) * limit) // Calcular el número de documentos a omitir
      .limit(parseInt(limit)); // Limitar el número de documentos a devolver

    const total = await TransactionModel.countDocuments({ user_id: id }); // Total de transacciones del usuario
    const totalPages = Math.ceil(total / limit); // Número total de páginas

    return dataResponse({
      transactions,
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las transacciones");
  }
}



async function listByTypeGeneral(req, res) {
  console.log("Listando transacciones por tipo general");
  try {
    const {
      type,
      page = 1,
      limit = 10,
      start_date,
      end_date,
      sortBy = "createdAt",
      sortOrder = "asc",
      user_id,
      sub_user_id,
      locker_id,
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    if (!type) {
      return errorResponse("El parámetro 'type' es requerido");
    }

    let filter = {};
    let model = TransactionModel;

    // Filtros por tipo de transacción
    if (type === "recarga") {
        filter = {
    details: { $regex: /^Pago de recarga telefonica\s*$/, $options: "i" },
    status: "Pagado",
  };
    } else if (type === "servicio") {
      filter = {
    details: { $regex: /^Pago de servicio\s*$/, $options: "i" },
    status: "Pagado",
  };
    } else if (type === "envio") {
      filter = {
        details: { $regex: /^Pago de \d+ envío\(s\)$/ },
        status: "Pagado",
        shipment_ids: { $exists: true, $ne: [] },
      };
    } else if (type === "empaque") {
      filter = {
        details: { $regex: /^Venta de \d+ empaques$/ },
        status: "Pagado",
      };
    } else if (type === "all") {
      filter = {};
    } else {
      return errorResponse("El parámetro 'type' no es válido");
    }

    // Filtros adicionales: usuario, subusuario y locker
    if (user_id) {
      filter.user_id = user_id;
    }
    if (sub_user_id) {
      filter.sub_user_id = sub_user_id;
    }
    if (locker_id) {
      filter.locker_id = locker_id;
    }
    if (user_id && sub_user_id) {
      filter.$and = [{ user_id }, { sub_user_id }];
    }

    // Filtro por rango de fechas
    if (start_date || end_date) {
      filter.transaction_date = {};
      console.log("Rango de fechas recibido:", start_date, end_date);
      if (start_date) filter.transaction_date.$gte = new Date(start_date);
      if (end_date) filter.transaction_date.$lte = new Date(end_date);
    }

    // Filtro por nombre o correo en `user_id` y `sub_user_id`

    // Ordenación dinámica
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

 
    console.log("Filtro aplicado:", filter);
    const transactions = await model
      .find(filter)
      .select("-receipt") // ⬅️ Aquí se omite el campo "receipt"
      .populate({
        path: "user_id",
        model: "Users",
        select: "name email",
      })
      .populate({
        path: "sub_user_id",
        model: "Users",
        select: "name email",
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

      console.log("Transacciones encontradas:", transactions.length);

    const total = await model.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNumber);

    return dataResponse({
      transactions,
      total,
      totalPages,
      currentPage: pageNumber,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    });
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las transacciones");
  }
}
// async function listByTypeGeneral(req, res) {
//   console.log("Listando transacciones por tipo general");
//   try {
//     const {
//       type,
//       page = 1,
//       limit = 10,
//       start_date,
//       end_date,
//       sortBy = "createdAt",
//       sortOrder = "asc",
//       user_id,
//       sub_user_id,
//       locker_id,
//     } = req.query;

//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);
//     const skip = (pageNumber - 1) * limitNumber;

//     if (!type) {
//       return errorResponse("El parámetro 'type' es requerido");
//     }

//     let filter = {};
//     let model = TransactionModel;

//     // Filtros por tipo de transacción
//     if (type === "recarga") {
//       filter = { details: "Pago de recarga telefonica", status: "Pagado" };
//     } else if (type === "servicio") {
//       filter = { details: "Pago de servicio", status: "Pagado" };
//     } else if (type === "envio") {
//       filter = {
//         details: { $regex: /^Pago de \d+ envío\(s\)$/ },
//         status: "Pagado",
//         shipment_ids: { $exists: true, $ne: [] },
//       };
//     } else if (type === "empaque") {
//       filter = {
//         details: { $regex: /^Venta de \d+ empaques$/ },
//         status: "Pagado",
//       };
//     } else if (type === "all") {
//       filter = {};
//     } else {
//       return errorResponse("El parámetro 'type' no es válido");
//     }

//     // Filtros adicionales: usuario, subusuario y locker
//     if (user_id) {
//       filter.user_id = user_id;
//     }
//     if (sub_user_id) {
//       filter.sub_user_id = sub_user_id;
//     }
//     if (locker_id) {
//       filter.locker_id = locker_id;
//     }
//     if (user_id && sub_user_id) {
//       filter.$and = [{ user_id }, { sub_user_id }];
//     }

//     // Filtro por rango de fechas
//     if (start_date || end_date) {
//       filter.transaction_date = {};
//       if (start_date) filter.transaction_date.$gte = new Date(start_date);
//       if (end_date) filter.transaction_date.$lte = new Date(end_date);
//     }

//     // Filtro por nombre o correo en `user_id` y `sub_user_id`

//     // Ordenación dinámica
//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

//     // Consulta a la base de datos
//     const transactions = await model
//       .find(filter)
//       .select("-receipt") // ⬅️ Aquí se omite el campo "receipt"
//       .populate({
//         path: "user_id",
//         model: "Users",
//         select: "name email",
//       })
//       .populate({
//         path: "sub_user_id",
//         model: "Users",
//         select: "name email",
//       })
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(limitNumber);

//       console.log("Transacciones encontradas:", transactions.length);

//     const total = await model.countDocuments(filter);
//     const totalPages = Math.ceil(total / limitNumber);

//     return dataResponse({
//       transactions,
//       total,
//       totalPages,
//       currentPage: pageNumber,
//       hasNextPage: pageNumber < totalPages,
//       hasPreviousPage: pageNumber > 1,
//     });
//   } catch (error) {
//     console.log(error);
//     return errorResponse("Error al obtener las transacciones");
//   }
// }

async function listByType(req, res) {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    if (!type) {
      return errorResponse("El parámetro 'type' es requerido");
    }

    if (!req.query.user_id) {
      return errorResponse("El parámetro 'user_id' es requerido");
    }

    console.log("Type:", type);
    console.log("User:", req.query.user_id);

    if (type === "recarga") {
      const filter = {
        user_id: req.query.user_id,
        details: { $regex: /^Pago de recarga telefonica\s*$/i },
        status: "Pagado",
      };

      const transactions = await TransactionModel.find(filter)
        .select("-receipt")
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await TransactionModel.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNumber);

      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    }

    
    else if (type === "servicio") {
      const filter = {
        user_id: req.query.user_id,
        details: { $regex: /^Pago de servicio\s*$/i },
        status: "Pagado",
      };

      const transactions = await TransactionModel.find(filter)
        .select("-receipt")
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await TransactionModel.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNumber);

      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    }


    else if (type === "envio") {
      const filter = {
        user_id: req.query.user_id,
        details: { $regex: /^Pago de \d+ envío\(s\)$/ },
        status: "Pagado",
        shipment_ids: { $exists: true, $ne: [] },
      };

      const transactions = await TransactionModel.find(filter)
        .select("-receipt")
        .populate({
          path: "shipment_ids",
          model: "Shipments",
          select: "-__v",
          populate: [
            { path: "user_id", model: "Users", select: "name email" },
            { path: "sub_user_id", model: "Users", select: "name email" },
          ],
        })
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await TransactionModel.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNumber);

      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    }

 
    else if (type === "empaque") {
      console.log("Buscando transacciones de empaque para el usuario:", req.query.user_id);

      const filter = {
        user_id: req.query.user_id,
        status: "Pagado",
      };

      const transactions = await PackingTransactionModel.find(filter)
        .select("-receipt")
        .populate({
          path: "packing_id",
          model: "Packing",
          select: "image name type weigth height width length description -_id",
        })
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email",
        })
        .populate({
          path: "sub_user_id",
          model: "Users",
          select: "name email",
        })
        .sort({ transaction_date: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await PackingTransactionModel.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNumber);

      console.log("Transacciones de empaque encontradas:", transactions.length);

      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    }

 
    return errorResponse("El parámetro 'type' no es válido");

  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las transacciones: " + error.message);
  }
}


async function getQuincenalProfit(req, res) {
  try {
    const { userId, year, month, quincena } = req.query;
    console.log("Parámetros recibidos:", userId, year, month, quincena);

    if (!userId || !year || !month || !quincena) {
      return errorResponse("Faltan parámetros requeridos (userId, year, month, quincena)");
    }

 
    const quincenaNum = Number(quincena);
    let startDate, endDate;

    if (quincenaNum === 1) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 15, 23, 59, 59);
    } else if (quincenaNum === 2) {
      startDate = new Date(year, month - 1, 16);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      return errorResponse("El valor de 'quincena' debe ser '1' o '2'");
    }

    console.log("Rango de fechas:", startDate, endDate);


    const result = await TransactionModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          status: "Pagado",
          details: { $regex: /^Pago de recarga telefonica\s*$/i },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);

    const totalRecargas = result.length > 0 ? result[0].total : 0;
    const porcentajeGlobal = totalRecargas * 0.05; // 5% global
    const gananciaLic = porcentajeGlobal * 0.7; // 70% para licenciatario

    console.log("Total recargas:", totalRecargas, "Ganancia licenciatario:", gananciaLic);

    return dataResponse({
      total_recargas: totalRecargas,
      porcentaje_global: porcentajeGlobal,
      ganancia_licenciatario: gananciaLic.toFixed(2),
      rango: { inicio: startDate, fin: endDate },
    });
  } catch (error) {
    console.error("Error en getQuincenalProfit:", error);
    return errorResponse("Error al obtener las transacciones");
  }
}


async function getQuincenalProfitServicios(req, res) {
  try {
    const { userId, year, month, quincena } = req.query;
    console.log("Parámetros recibidos:", userId, year, month, quincena);

    if (!userId || !year || !month || !quincena) {
      return errorResponse("Faltan parámetros requeridos (userId, year, month, quincena)");
    }

  
    const quincenaNum = Number(quincena);
    let startDate, endDate;

    if (quincenaNum === 1) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 15, 23, 59, 59);
    } else if (quincenaNum === 2) {
      startDate = new Date(year, month - 1, 16);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      return errorResponse("El valor de 'quincena' debe ser '1' o '2'");
    }

    console.log("Rango de fechas:", startDate, endDate);


    const totalTransacciones = await TransactionModel.countDocuments({
      user_id: new mongoose.Types.ObjectId(userId),
      status: "Pagado",
      details: { $regex: /^Pago de servicio\s*$/i },
      createdAt: { $gte: startDate, $lte: endDate },
    });


    const pagoPorTransaccion = 6.3; // pesos por transacción
    const gananciaLic = totalTransacciones * pagoPorTransaccion;

    console.log("Total transacciones:", totalTransacciones, "Ganancia licenciatario:", gananciaLic);


    return dataResponse({
      total_transacciones: totalTransacciones,
      ganancia_licenciatario: gananciaLic.toFixed(2),
      rango: { inicio: startDate, fin: endDate },
    });

  } catch (error) {
    console.error("Error en getQuincenalProfitServicios:", error);
    return errorResponse("Error al obtener las transacciones");
  }
}



async function getTransactionById(req, res) {
  try {
    const { id } = req.params;
    console.log("ID de la transacción recibida:", id);
    const transaction = await TransactionModel.findById(id)
      .populate("user_id", "name surname email phone") // Poblamos con los campos deseados
      .populate("sub_user_id", "name surname email phone"); // Poblamos con los campos deseados

    if (transaction) {
      return dataResponse(transaction);
    }
    return errorResponse("Transacción no encontrada");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener la transacción");
  }
}

module.exports = {
  getAll,
  getByUser,
  getQuincenalProfit,
  listByType,
  listByTypeGeneral,
  getQuincenalProfitServicios,
  getTransactionById,
  getReciptById
};
