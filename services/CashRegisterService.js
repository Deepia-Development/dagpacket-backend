// services/cashRegisterService.js
const CashRegisterModel = require('../models/CashRegisterModel');
const CashTransactionModel = require('../models/CashTransactionModel');
const UserModel = require('../models/UsersModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper')

async function getAllCashRegisters(req) {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (startDate && endDate) {
      query.opened_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalRegisters = await CashRegisterModel.countDocuments(query);
    const totalPages = Math.ceil(totalRegisters / limit);

    const cashRegisters = await CashRegisterModel.find(query)
      .sort({ opened_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const cashRegistersWithTransactions = await Promise.all(cashRegisters.map(async (register) => {
      const transactions = await CashTransactionModel.find({ cash_register_id: register._id })
        .sort({ createdAt: -1 })
        .lean();

      return {
        ...register,
        transactions
      };
    }));

    return dataResponse('Registros de caja obtenidos exitosamente', {
      cashRegisters: cashRegistersWithTransactions,
      currentPage: parseInt(page),
      totalPages,
      totalRegisters
    });
  } catch (error) {
    console.error('Error al obtener los registros de caja:', error);
    return errorResponse('Error al obtener los registros de caja');
  }
}

async function openCashRegister(userId) {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    console.log('Usuario intentando abrir caja:', user.role, user._id);

    // Verificar si ya existe una caja abierta
    const existingOpenRegister = await CashRegisterModel.findOne({
      opened_by: user._id,
      status: 'open'
    });

    console.log('Caja abierta encontrada:', existingOpenRegister);

    if (existingOpenRegister) {
      throw new Error('Ya existe una caja abierta');
    }

    // Crear una nueva caja
    const newCashRegister = new CashRegisterModel({
      licensee_id: user.role === 'CAJERO' ? user.parentUser : user._id,
      employee_id: user.role === 'CAJERO' ? user._id : undefined,
      opened_by: user._id,
      user_type: user.role
    });

    const savedCashRegister = await newCashRegister.save();
    console.log('Nueva caja abierta:', savedCashRegister);

    return {
      success: true,
      message: 'Caja abierta exitosamente',
      data: {
        _id: savedCashRegister._id,
        opened_at: savedCashRegister.opened_at,
        openedBy: savedCashRegister.opened_by,
        userType: savedCashRegister.user_type,
        licenseeId: savedCashRegister.licensee_id,
        employeeId: savedCashRegister.employee_id,
        total_sales: savedCashRegister.total_sales
      }
    };
  } catch (error) {
    console.error('Error al abrir la caja:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

async function closeCashRegister(userId) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Find the open cash register for this user
  const cashRegister = await CashRegisterModel.findOne({ 
    $or: [
      { 
        opened_by: user._id, 
        status: 'open', 
        employee_id: user._id 
      },
      { 
        opened_by: user._id, 
        status: 'open', 
        licensee_id: user._id 
      }
    ]
  });

  if (!cashRegister) {
    throw new Error('No hay caja abierta para cerrar');
  }

  cashRegister.status = 'closed';
  cashRegister.closed_at = Date.now();
  cashRegister.closed_by = userId;
  await cashRegister.save();

  return {
    success: true,
    message: 'Caja cerrada exitosamente',
    data: {
      openedAt: cashRegister.opened_at,
      closedAt: cashRegister.closed_at,
      totalSales: cashRegister.total_sales,
      openedBy: cashRegister.opened_by,
      closedBy: cashRegister.closed_by
    }
  };
}

module.exports = { openCashRegister, closeCashRegister, getAllCashRegisters };