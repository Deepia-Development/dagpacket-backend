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
      .populate({
        path: 'opened_by',
        model: 'Users',
        select: 'name email'
      })
      .lean();

      console.log('Cajas encontradas:', cashRegisters);

      const cashRegistersWithTransactions = await Promise.all(cashRegisters.map(async (register) => {
        const transactions = await CashTransactionModel.find({ cash_register_id: register._id })
          .sort({ createdAt: -1 })
          .populate({
            path: 'operation_by',
            model: 'Users', // Ensure this matches your User model name
            select: 'name email' // Select specific fields you want
          })
          .lean();
          
     //   console.log('Transacciones encontradas:', transactions);
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

async function getAllCashRegistersByLicenseId(req) {
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
      .populate({
        path: 'opened_by',
        model: 'Users',
        select: 'name email'
      })
      .lean();

      console.log('Cajas encontradas:', cashRegisters);

      const cashRegistersWithTransactions = await Promise.all(cashRegisters.map(async (register) => {
        const transactions = await CashTransactionModel.find({ cash_register_id: register._id })
          .sort({ createdAt: -1 })
          .populate({
            path: 'operation_by',
            model: 'Users', // Ensure this matches your User model name
            select: 'name email' // Select specific fields you want
          })
          .lean();
          
     //   console.log('Transacciones encontradas:', transactions);
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

    

    const savedCashRegister = await newCashRegister.save()

    const populatedCashRegister = await savedCashRegister.populate({
      path: 'opened_by', 
      model: 'Users', 
      select: 'name email' 
    });

    console.log('Nueva caja abierta:', populatedCashRegister);

    return {
      success: true,
      message: 'Caja abierta exitosamente',
      data: {
        _id: populatedCashRegister._id,
        opened_at: populatedCashRegister.opened_at,
        opened_by: {
          _id: populatedCashRegister.opened_by._id,
          name: populatedCashRegister.opened_by.name,
          email: populatedCashRegister.opened_by.email
        },
        userType: populatedCashRegister.user_type,
        licenseeId: populatedCashRegister.licensee_id,
        employeeId: populatedCashRegister.employee_id,
        total_sales: populatedCashRegister.total_sales
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

  console.log('Buscando caja abierta para el usuario:', user._id);
  
  // Find the open cash register for this user
  const cashRegister = await CashRegisterModel.findOne({ 
    $or: [
      { 
        employee_id: user._id,
        opened_by: user._id, 
        status: 'open'
      },
      { 
        licensee_id: user._id,
        status: 'open', 
      }
    ]
  });


  console.log('Caja abierta encontrada:', cashRegister);

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
      opened_by: cashRegister.opened_by,
      closedBy: cashRegister.closed_by
    }
  };
}

module.exports = { openCashRegister, closeCashRegister, getAllCashRegisters };