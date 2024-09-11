const UserModel = require('../models/UsersModel');
const EmployeesModel = require('../models/EmployeesModel');
const CashRegisterModel = require('../models/CashRegisterModel');
const CashTransactionModel = require('../models/CashTransactionModel');
const { openCashRegister, closeCashRegister,  } = require('../services/CashRegisterService')
const CashRegisterService = require('../services/CashRegisterService')
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

exports.openCashRegister = async (req, res) => {
  try {    
    const userId = req.user.user._id; // Accedemos al ID correctamente
    const userRole = req.user.user.role; 

    const cashRegister = await openCashRegister(userId, userRole);
    res.json(dataResponse('Caja abierta exitosamente', cashRegister));
  } catch (error) {
    console.error('Error al abrir caja:', error);
    res.status(400).json(errorResponse(error.message));
  }
};


exports.getCurrentCashRegister = async (req, res) => {
  try {
    const userId = req.user.user._id;
    console.log('Buscando caja para el usuario:', userId);

    const cashRegister = await CashRegisterModel.findOne({ 
      $or: [
        { licensee_id: userId, status: 'open' },
        { opened_by: userId, status: 'open' }
      ]
    });

    console.log('Caja encontrada:', cashRegister);

    if (cashRegister) {
      res.json(await dataResponse('Caja actual encontrada', cashRegister));
    } else {
      res.json(await successResponse('No hay caja abierta actualmente'));
    }
  } catch (error) {
    console.error('Error al obtener la caja actual:', error);
    res.status(500).json(await errorResponse('Error al obtener la caja actual'));
  }
};

exports.closeCashRegister = async (req, res) => {
  try {
    const userId = req.user.user._id;
    
    const result = await closeCashRegister(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error al cerrar la caja:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cerrar la caja'
    });
  }
};

exports.getCashTransactions = async (req, res) => {
  try {
    const userId = req.user.user._id;

    // Buscar la caja abierta actual
    const currentCashRegister = await CashRegisterModel.findOne({
      $or: [
        { licensee_id: userId, status: 'open' },
        { opened_by: userId, status: 'open' }
      ]
    });

    if (!currentCashRegister) {
      return res.status(404).json(await errorResponse('No hay caja abierta actualmente'));
    }

    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Contar total de transacciones
    const totalTransactions = await CashTransactionModel.countDocuments({
      cash_register_id: currentCashRegister._id
    });

    // Obtener transacciones paginadas
    const transactions = await CashTransactionModel.find({
      cash_register_id: currentCashRegister._id
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalPages = Math.ceil(totalTransactions / limit);

    const responseData = {
      transactions,
      currentPage: page,
      totalPages,
      totalTransactions,
      limit
    };

    res.json(await dataResponse('Transacciones obtenidas exitosamente', responseData));
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json(await errorResponse('Error al obtener las transacciones'));
  }
};

exports.getAllCashRegisters = async (req, res) => {
  try {
    const result = await CashRegisterService.getAllCashRegisters(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en getAllCashRegisters controller:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
