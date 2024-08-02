// services/cashRegisterService.js
const CashRegisterModel = require('../models/CashRegisterModel');
const UserModel = require('../models/UsersModel');
const EmployeesModel = require('../models/EmployeesModel');

async function openCashRegister(userId) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  let licenseeId = user.role === 'LICENCIATARIO_TRADICIONAL' ? user._id : user.licensee_id;

  const existingOpenRegister = await CashRegisterModel.findOne({
    licensee_id: licenseeId,
    status: 'open'
  });

  if (existingOpenRegister) {
    throw new Error('Ya existe una caja abierta para este licenciatario');
  }

  const newCashRegister = new CashRegisterModel({
    licensee_id: licenseeId,
    opened_by: userId
  });

  return await newCashRegister.save();
}

async function closeCashRegister(userId) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  let licenseeId = user.role === 'LICENCIATARIO_TRADICIONAL' ? user._id : user.licensee_id;

  const cashRegister = await CashRegisterModel.findOne({
    licensee_id: licenseeId,
    status: 'open'
  });

  if (!cashRegister) {
    throw new Error('No hay caja abierta para cerrar');
  }

  cashRegister.status = 'closed';
  cashRegister.closed_at = Date.now();
  await cashRegister.save();

  return {
    openedAt: cashRegister.opened_at,
    closedAt: cashRegister.closed_at,
    totalSales: cashRegister.total_sales
  };
}

module.exports = { openCashRegister, closeCashRegister };