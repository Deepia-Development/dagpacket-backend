const UserModel = require('../models/UsersModel');
const EmployeesModel = require('../models/EmployeesModel');
const CashRegisterModel = require('../models/CashRegisterModel');
const { closeCashRegister } = require('../services/CashCutService')
const CashTransactionModel = require('../models/CashTransactionModel');
const { openCashRegister } = require('../services/CashRegisterService')
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

exports.openCashRegister = async (req, res) => {
  try {
    const { initialBalance } = req.body;
    const userId = req.user.user._id; // Accedemos al ID correctamente
    const userRole = req.user.user.role; 

    const cashRegister = await openCashRegister(userId, initialBalance, userRole);
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
        { employee_id: userId, status: 'open' }
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
    
    if (result.success) {
      res.json(await dataResponse(result.message, result.data));
    } else {
      res.status(400).json(await errorResponse(result.message));
    }
  } catch (error) {
    console.error('Error al cerrar la caja:', error);
    res.status(500).json(await errorResponse('Error interno al cerrar la caja'));
  }
};

// controllers/cashRegisterController.js
exports.getCashTransactions = async (req, res) => {
  try {
    const userId = req.user.user._id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json(await errorResponse('Usuario no encontrado'));
    }

    let licenseeId = user.role === 'LICENCIATARIO_TRADICIONAL' ? user._id : user.licensee_id;

    const currentCashRegister = await CashRegisterModel.findOne({
      licensee_id: licenseeId,
      status: 'open'
    });

    if (!currentCashRegister) {
      return res.status(404).json(await errorResponse('No hay caja abierta actualmente'));
    }

    const transactions = await CashTransactionModel.find({
      cash_register_id: currentCashRegister._id
    })
    .sort({ createdAt: -1 })

    const responseData = {
      transactions,
      totalTransactions: transactions.length
    };

    res.json(await dataResponse('Transacciones obtenidas exitosamente', responseData));
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json(await errorResponse('Error al obtener las transacciones'));
  }
};