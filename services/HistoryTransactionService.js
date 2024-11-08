const TransactionModel = require("../models/TransactionsModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

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

module.exports = {
  getAll,
  getByUser,
};
