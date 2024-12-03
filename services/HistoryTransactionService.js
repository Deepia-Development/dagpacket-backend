const TransactionModel = require("../models/TransactionsModel");
const ShipmentsModel = require("../models/ShipmentsModel.js");

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
  try {
    const { type } = req.query;

    if (!type) {
      return errorResponse("El parámetro 'type' es requerido");
    }

    if (type === "recarga") {
      const transactions = await TransactionModel.find({
        details: "Pago de recarga telefonica",
        status: "Pagado",
      });
      return dataResponse(transactions);
    } else if (type === "servicio") {
      const transactions = await TransactionModel.find({
        details: "Pago de servicio",
        status: "Pagado",
      });
      return dataResponse(transactions);
    } else if (type === "envio") {
      const transactions = await TransactionModel.find({
        details: { $regex: /^Pago de \d+ envío\(s\)$/ },
        status: "Pagado",
      });
      return dataResponse(transactions);
    } else if (type === "empaque") {
      const transactions = await ShipmentsModel.find({
        "packing.answer": "Si", // Usar notación de punto para propiedades anidadas
        "payment.status": "Pagado", // Usar notación de punto para propiedades anidadas
      })
        .populate({
          path: "packing.packing_id", // Relación al modelo Packing
          model: "Packing",
          select: "description sell_price cost_price", // Campos específicos para Packing
        })
        .populate({
          path: "user_id sub_user_id", // Relación a campos que comparten el mismo modelo
          model: "Users", // Modelo compartido
          select: "name email", // Campos específicos para Users
        });

      return dataResponse(transactions);
    }

    return errorResponse("El parámetro 'type' no es válido");
  } catch (error) {
    console.log(error);
    console.log("Error al obtener las transacciones");
    return errorResponse("Error al obtener las transacciones");
  }
}

async function listByType(req, res) {
  try {
    const { type } = req.query;

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
      });
      return dataResponse(transactions);
    } else if (type === "servicio") {
      const transactions = await TransactionModel.find({
        user_id: req.query.user_id,
        details: "Pago de servicio",
        status: "Pagado",
      });
      return dataResponse(transactions);
    } else if (type === "envio") {
      const transactions = await TransactionModel.find({
        user_id: req.query.user_id,
        details: { $regex: /^Pago de \d+ envío\(s\)$/ },
        status: "Pagado",
      });
      return dataResponse(transactions);
    } else if (type === "empaque") {
      console.log("Data", req.query);
      const transactions = await ShipmentsModel.find({
        user_id: req.query.user_id,
        "packing.answer": "Si", // Usar notación de punto para propiedades anidadas
        "payment.status": "Pagado", // Usar notación de punto para propiedades anidadas
      })
        .populate({
          path: "packing.packing_id", // Relación al modelo Packing
          model: "Packing",
          select: "description sell_price cost_price", // Campos específicos para Packing
        })
        .populate({
          path: "user_id sub_user_id", // Relación a campos que comparten el mismo modelo
          model: "Users", // Modelo compartido
          select: "name email", // Campos específicos para Users
        });

      console.log("Empaque", transactions);

      return dataResponse(transactions);
    }

    return errorResponse("El parámetro 'type' no es válido");
  } catch (error) {
    console.log(error);
    console.log("Error al obtener las transacciones");
    return errorResponse("Error al obtener las transacciones");
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

module.exports = {
  getAll,
  getByUser,
  getQuincenalProfit,
  listByType,
  listByTypeGeneral,
};
