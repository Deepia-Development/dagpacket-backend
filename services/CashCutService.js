// services/cashRegisterService.js
const CashRegisterModel = require('../models/CashRegisterModel');
const UserModel = require('../models/UsersModel');
const CashTransactionModel = require('../models/CashTransactionModel');

async function closeCashRegister(userId) {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    let licenseeId = user.role === 'LICENCIATARIO_TRADICIONAL' ? user._id : user.licensee_id;

    const cashRegister = await CashRegisterModel.findOne({
      licensee_id: licenseeId,
      status: 'open'
    });

    if (!cashRegister) {
      return { success: false, message: 'No hay caja abierta para cerrar' };
    }

    // Calcular el total de transacciones
    const transactions = await CashTransactionModel.find({
      cash_register_id: cashRegister._id
    });

    const totalSales = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    cashRegister.status = 'closed';
    cashRegister.closed_at = Date.now();
    cashRegister.total_sales = totalSales;
    await cashRegister.save();

    return {
      success: true,
      message: 'Caja cerrada exitosamente',
      data: {
        openedAt: cashRegister.opened_at,
        closedAt: cashRegister.closed_at,
        totalSales: totalSales
      }
    };
  } catch (error) {
    console.error('Error al cerrar la caja:', error);
    return { success: false, message: 'Error interno al cerrar la caja' };
  }
}

module.exports = { closeCashRegister };