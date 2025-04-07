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
      sortOrder = "desc",
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
      filter = { details: "Pago de recarga telefonica", status: "Pagado" };
    } else if (type === "servicio") {
      filter = { details: "Pago de servicio", status: "Pagado" };
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
      if (start_date) filter.transaction_date.$gte = new Date(start_date);
      if (end_date) filter.transaction_date.$lte = new Date(end_date);
    }

    // Filtro por nombre o correo en `user_id` y `sub_user_id`

    // Ordenación dinámica
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Consulta a la base de datos
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

async function listByType(req, res) {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    if (!type) {
      return errorResponse("El parámetro 'type' es requerido");
    }

    if (req.query.user_id === undefined) {
      return errorResponse("El parámetro 'user_id' es requerido");
    }

    console.log("Type", type);
    console.log("User", req.query.user_id);

    if (type === "recarga") {
      const transactions = await TransactionModel.find({
        user_id: req.query.user_id,
        details: "Pago de recarga telefonica",
        status: "Pagado",
      })
        .select("-receipt") // ⬅️ Excluir el campo "receipt"
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await TransactionModel.countDocuments({
        user_id: req.query.user_id,
        details: "Pago de recarga telefonica",
        status: "Pagado",
      }); // Total de transacciones del usuario
      const totalPages = Math.ceil(total / limitNumber); // Número total de páginas
      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    } else if (type === "servicio") {
      const transactions = await TransactionModel.find({
        user_id: req.query.user_id,
        details: "Pago de servicio",
        status: "Pagado",
      })
        .select("-receipt") // ⬅️ Excluir el campo "receipt"
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email", // Select name and email for main user
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await TransactionModel.countDocuments({
        user_id: req.query.user_id,
        details: "Pago de servicio",
        status: "Pagado",
      }); // Total de transacciones del usuario
      const totalPages = Math.ceil(total / limitNumber); // Número total de páginas

      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    } else if (type === "envio") {
      const transactions = await TransactionModel.find({
        user_id: req.query.user_id,
        details: { $regex: /^Pago de \d+ envío\(s\)$/ },
        status: "Pagado",
        shipment_ids: { $exists: true, $ne: [] }, // Ensures shipment_ids exists and is not an empty array
      })
        .select("-receipt") // ⬅️ Excluir el campo "receipt"
        .populate({
          path: "shipment_ids",
          model: "Shipments",
          select: "-__v", // Exclude version key, include all other shipment fields
          populate: [
            {
              path: "user_id",
              model: "Users",
              select: "name email", // Select name and email for main user
            },
            {
              path: "sub_user_id",
              model: "Users",
              select: "name email", // Select name and email for sub user
            },
          ],
        })

        .populate({
          path: "user_id",
          model: "Users",
          select: "name email", // Select name and email for main user
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      const total = await TransactionModel.countDocuments({
        user_id: req.query.user_id,
        details: { $regex: /^Pago de \d+ envío\(s\)$/ },
        status: "Pagado",
        shipment_ids: { $exists: true, $ne: [] }, // Ensures shipment_ids exists and is not an empty array
      }); // Total de transacciones del usuario
      const totalPages = Math.ceil(total / limitNumber); // Número total de páginas

      return dataResponse({
        transactions,
        total,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      });
    } else if (type === "empaque") {
      console.log(
        "Buscando transacciones de empaque para el usuario:",
        req.query.user_id
      );

      // Usar PackingTransactionModel en lugar de ShipmentsModel
      const transactions = await PackingTransactionModel.find({
        user_id: req.query.user_id,
        status: "Pagado",
      })
        .select("-receipt") // ⬅️ Excluir el campo "receipt"
        .populate({
          path: "packing_id",
          model: "Packing",
          select: "image name type weigth height width length description -_id", // Todos los campos excepto cost_price, sell_price y _id
        })
        .populate({
          path: "user_id",
          model: "Users",
          select: "name email", // Campos específicos para el usuario principal
        })
        .populate({
          path: "sub_user_id",
          model: "Users",
          select: "name email", // Campos específicos para el sub-usuario
        })
        .sort({ transaction_date: -1 }) // Ordenar por fecha de transacción
        .skip(skip)
        .limit(limitNumber);

      const total = await PackingTransactionModel.countDocuments({
        user_id: req.query.user_id,
        status: "Pagado",
      });

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
    console.log("Error al obtener las transacciones");
    return errorResponse(
      "Error al obtener las transacciones: " + error.message
    );
  }
}

async function getQuincenalProfit(req, res) {
  try {
    const { userId, year, month, quincena } = req.query;
    let startDate, endDate;

    // Convertimos quincena a número para realizar la comparación correctamente
    const quincenaNum = Number(quincena);

    if (quincenaNum === 1) {
      // Primera quincena
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 15);
      console.log("Primera quincena:", startDate, endDate);
    } else if (quincenaNum === 2) {
      // Segunda quincena
      startDate = new Date(year, month - 1, 16);
      endDate = new Date(year, month, 0); // Día 0 del siguiente mes equivale al último día del mes actual
      console.log("Segunda quincena:", startDate, endDate);
    } else {
      console.log("Error: El valor de 'quincena' debe ser '1' o '2'.");
    }

    const result = await TransactionModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          details: "Pago de recarga telefonica",
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    console.log(result);
    return dataResponse(result);
  } catch (error) {
    console.error("Error en getQuincenalProfit:", error);
    return errorResponse("Error al obtener las transacciones");
  }
}

async function getQuincenalProfitServicios(req, res) {
  try {
    const { userId, year, month, quincena } = req.query;
    let startDate, endDate;

    // Convertimos quincena a número para realizar la comparación correctamente
    const quincenaNum = Number(quincena);

    if (quincenaNum === 1) {
      // Primera quincena
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 15);
      console.log("Primera quincena:", startDate, endDate);
    } else if (quincenaNum === 2) {
      // Segunda quincena
      startDate = new Date(year, month - 1, 16);
      endDate = new Date(year, month, 0); // Día 0 del siguiente mes equivale al último día del mes actual
      console.log("Segunda quincena:", startDate, endDate);
    } else {
      console.log("Error: El valor de 'quincena' debe ser '1' o '2'.");
    }

    const result = await TransactionModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          details: "Pago de servicio",
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    console.log(result);
    return dataResponse(result);
  } catch (error) {
    console.error("Error en getQuincenalProfit:", error);
    return errorResponse("Error al obtener las transacciones");
  }
}

async function getTransactionById(req, res) {
  try {
    const { id } = req.params;
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
