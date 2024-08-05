const ShipmentsModel = require('../models/ShipmentsModel');
const UserPackingInventoryModel = require('../models/UserPackingModel');
const PackingModel = require('../models/PackingModel');
const UserModel = require('../models/UsersModel');
const EmployeesModel = require('../models/EmployeesModel');
const CashRegisterModel = require('../models/CashRegisterModel');
const CashTransactionModel = require('../models/CashTransactionModel');
const TransactionModel = require('../models/TransactionsModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const mongoose = require('mongoose');

async function createShipment(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      shipment_type,
      from,
      to,
      payment,
      packing: requestPacking,
      shipment_data,
      insurance,
      cost,
      price,
      extra_price,
      discount,
      dagpacket_profit,
      provider,
      idService
    } = req.body;

    const userId = req.params.userId;

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.stock < 1) {
      throw new Error('Stock insuficiente para crear el envío');
    }

    let packing = {
      answer: 'No',
      packing_id: null,
      packing_type: 'None',
      packing_cost: 0
    };

    if (requestPacking && requestPacking.answer === 'Si' && requestPacking.packing_id) {
      const userInventory = await UserPackingInventoryModel.findOne({ user_id: userId }).session(session);
      
      if (!userInventory) {
        throw new Error('No se encontró inventario para este usuario');
      }

      const packingInventory = userInventory.inventory.find(
        item => item.packing_id.toString() === requestPacking.packing_id.toString()
      );

      if (!packingInventory || packingInventory.quantity <= 0) {
        throw new Error('No hay suficiente inventario de este empaque');
      }

      const packingInfo = await PackingModel.findById(requestPacking.packing_id).session(session);
      if (!packingInfo) {
        throw new Error('Empaque no encontrado');
      }

      await UserPackingInventoryModel.findOneAndUpdate(
        { user_id: userId, 'inventory.packing_id': requestPacking.packing_id },
        { $inc: { 'inventory.$.quantity': -1 } },
        { session }
      );

      packing = {
        answer: 'Si',
        packing_id: requestPacking.packing_id,
        packing_type: packingInfo.type,
        packing_cost: packingInfo.sell_price
      };
    }

    const newShipment = new ShipmentsModel({
      user_id: userId,
      shipment_type,
      from,
      to,
      payment: {
        ...payment,
        status: 'Pendiente'
      },
      packing,
      shipment_data,
      insurance,
      cost,
      price,
      extra_price,
      discount,
      dagpacket_profit,
      provider,
      idService
    });

    await newShipment.save({ session });

    user.stock -= 1;
    await user.save({ session });

    await session.commitTransaction();
    return successResponse('Envío creado exitosamente', newShipment);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear el envío:', error);
    return errorResponse(error.message);
  } finally {
    session.endSession();
  }
}

async function shipmentProfit(req) {
  try {
    const { id } = req.params;
    
    // Obtener la fecha actual
    const now = new Date();      
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);    
    // Calcular el primer día del mes pasado
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);    
    // Calcular el último día del mes pasado
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const result = await ShipmentsModel.aggregate([
      { $match: { 
        user_id: new mongoose.Types.ObjectId(id),
        createdAt: { $gte: firstDayLastMonth } // Considerar solo envíos desde el inicio del mes pasado
      }},
      {
        $project: {
          extra_price: { $toDecimal: "$extra_price" },
          month: { $month: "$createdAt" }
        }
      },
      {
        $group: {
          _id: "$month",
          profit: { $sum: "$extra_price" }
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          profit: { $round: ["$profit", 2] }
        }
      }
    ]);
    
    if (result.length === 0) {
      return errorResponse('No se encontraron envíos para el usuario especificado en los últimos dos meses');
    }
    // Inicializar las ganancias
    let lastMonthProfit = 0;
    let currentMonthProfit = 0;
    // Asignar las ganancias al mes correspondiente
    result.forEach(item => {
      if (item.month === lastDayLastMonth.getMonth() + 1) {
        lastMonthProfit = item.profit;
      } else if (item.month === now.getMonth() + 1) {
        currentMonthProfit = item.profit;
      }
    });

    return dataResponse('Ganancias calculadas exitosamente', { 
      lastMonthProfit,
      currentMonthProfit
    });    
  } catch (error) {
    console.log('No se pudo calcular la ganancia: ' + error);
    return errorResponse('No se pudo calcular la ganancia');
  }
}

async function getProfitPacking(req) {
  try {
    const { id } = req.params;
    const result = await ShipmentsModel.aggregate([
      { 
        $match: { 
          user_id: new mongoose.Types.ObjectId(id),
          'packing.answer': 'Si'  // Solo consideramos envíos con empaque
        }
      },
      {
        $group: {
          _id: null,
          totalPackingCost: { 
            $sum: { $toDecimal: "$packing.packing_cost" }
          },
          totalPackings: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalPackingCost: { $round: ["$totalPackingCost", 2] },
          totalPackings: 1
        }
      }
    ]);
    
    if (result.length === 0) {
      return successResponse({ 
        totalPackingCost: 0, 
        totalPackings: 0 
      });
    }

    const packingInfo = result[0];
    return successResponse(packingInfo);    
  } catch (error) {
    console.log('No se pudo calcular el costo total de empaque: ' + error);
    return errorResponse('No se pudo calcular el costo total de empaque');
  }
}

async function getUserShipments(req) {
  try {
    const { id } = req.params;
    const shipments = await ShipmentsModel.find({ user_id: id })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    if (shipments.length === 0) {
      return errorResponse('No se encontraron envíos');
    }
    return dataResponse('Envíos', shipments);
  } catch (error) {
    console.log('No se pudieron obtener los envíos: ' + error);
    return errorResponse('Error al obtener los envíos');
  }
}

async function globalProfit() {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    const result = await ShipmentsModel.aggregate([
      {
        $match: {
          distribution_at: {
            $gte: new Date(currentYear, currentMonth, 1), // Inicio del mes actual
            $lt: new Date(currentYear, currentMonth + 1, 1) // Inicio del próximo mes
          }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: { $toDouble: "$dagpacket_profit" } }
        }
      },
      {
        $project: {
          _id: 0,
          month: currentMonth + 1, // Ajustamos para que sea 1-12 en lugar de 0-11
          totalProfit: { $round: ["$totalProfit", 2] }
        }
      }
    ]);

    // Si no hay resultados, devolvemos un objeto con utilidad 0
    const monthlyProfit = result[0] || { month: currentMonth + 1, totalProfit: 0 };

    return successResponse({ monthlyProfit });
  } catch (error) {
    console.log('No se pudo calcular la ganancia global para el mes actual: ' + error);
    return errorResponse('No se pudo calcular la ganancia global para el mes actual');
  }
}

async function getAllShipments(){
  try {
    const Tracking = await ShipmentsModel.find();
    if(Tracking){
      return dataResponse('Todos los envios', Tracking);
    }
  } catch (error) {
    console.log('Error al obtener los envios' + error);
    return errorResponse('Error el obtener los envios')
  }
}

async function payShipments(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ids, paymentMethod, transactionNumber } = req.body;
    const userId = req.user.user._id;

    let user = await UserModel.findById(userId).session(session);
    let actualUserId = userId;

    if (!user) {
      // Verificar si es un cajero
      const employee = await EmployeesModel.findOne({ _id: userId }).populate('user_id').session(session);
      if (employee) {
        user = employee.user_id;
        actualUserId = user._id; // El ID del usuario al que está ligado el cajero
      } else {
        throw new Error('Usuario no encontrado');
      }
    }

    const shipments = await ShipmentsModel.find({ _id: { $in: ids } }).session(session);
    if (shipments.length === 0) {
      throw new Error('No se encontraron envíos pendientes de pago');
    }

    let totalPrice = shipments.reduce((total, shipment) => 
      total + (shipment.payment.status !== 'Pagado' ? parseFloat(shipment.price.toString()) : 0), 0);

    // Verificar saldo del usuario si el método de pago es 'saldo'
    if (paymentMethod === 'saldo') {
      const userBalance = parseFloat(user.balance.toString());
      if (userBalance < totalPrice) {
        throw new Error('Saldo insuficiente en la cuenta');
      }
      user.balance = userBalance - totalPrice;
      await user.save({ session });
    }

    // Registrar la transacción general
    const transaction = new TransactionModel({
      user_id: actualUserId,
      licensee_id: user.role === 'LICENCIATARIO_TRADICIONAL' ? user._id : user.licensee_id,
      shipment_ids: ids,
      transaction_number: transactionNumber || `${Date.now()}`,
      payment_method: paymentMethod,
      amount: totalPrice,
      details: `Pago de ${shipments.length} envío(s)`
    });
    await transaction.save({ session });

    let currentCashRegister;
    if (user.role === 'CAJERO') {
      // Si es cajero, buscar por employee_id
      currentCashRegister = await CashRegisterModel.findOne({
        employee_id: userId,
        status: 'open'
      }).session(session);
    } else {
      // Si es ADMIN o LICENCIATARIO_TRADICIONAL, buscar por licensee_id
      currentCashRegister = await CashRegisterModel.findOne({
        licensee_id: actualUserId,
        status: 'open'
      }).session(session);
    }
    
    if (currentCashRegister) {
      // Registrar la transacción en la caja
      const cashTransaction = new CashTransactionModel({
        cash_register_id: currentCashRegister._id,
        transaction_id: transaction._id,
        licensee_id: user.role === 'CAJERO' ? user.user_id : actualUserId,
        employee_id: user.role === 'CAJERO' ? userId : undefined,
        payment_method: paymentMethod,
        amount: totalPrice,
        type: 'ingreso',
        details: `Pago de ${shipments.length} envío(s)`
      });
      await cashTransaction.save({ session });
    
      // Actualizar el total de ventas de la caja
      currentCashRegister.total_sales += totalPrice;
      await currentCashRegister.save({ session });
    }

    // Actualizar envíos
    for (const shipment of shipments) {
      if (shipment.payment.status !== 'Pagado') {
        shipment.payment.status = 'Pagado';
        shipment.payment.method = paymentMethod;
        shipment.payment.transaction_number = transaction.transaction_number;
        shipment.payment.transaction_id = transaction._id;
        await shipment.save({ session });
      }
    }

    await session.commitTransaction();
    return { success: true, message: 'Envíos pagados exitosamente' };
  } catch (error) {
    await session.abortTransaction();
    return { success: false, message: error.message };
  } finally {
    session.endSession();
  }
}

async function userPendingShipments(req) {
  try {
    const { id } = req.params;
    const pendingShipments = await ShipmentsModel.find({
      user_id: id,
      'payment.status': 'Pendiente'
    });
    
    if (pendingShipments.length > 0) {
      return dataResponse('Envíos pendientes:', pendingShipments);
    } else {
      return dataResponse('No hay envíos pendientes', []);
    }
  } catch (error) {
    console.log('Error al obtener los envíos pendientes: ' + error);
    return errorResponse('Error al obtener los envíos pendientes');
  }
}

async function userShipments(req){
  try {
    const { user_id } = req.params;
    const Shipment = await ShipmentsModel.find({ user_id: user_id });

    if(Shipment){
      return dataResponse('Hisotorial de envios', Shipment)
    }
  } catch (error) {
    return errorResponse('Algo ocurrio', error.message)
  }
}

async function detailShipment(req){
  try {
    const { id } = req.params;
    const Shipment = await ShipmentsModel.findOne({_id: id});
    if(Shipment){
      return dataResponse('Detalles del envio', Shipment)
    } else {
      return errorResponse('No se econtro el pedido')
    }
  } catch (error) {
    return errorResponse('Ocurrio un error: ' + error)
  }
}

async function saveGuide(req){
  try {
    const { id } = req.params;
    const Shipment = await ShipmentsModel.findOneAndUpdate(
      {_id: id },
      { guide: req.body.guide,
        guide_number: req.body.guide_number
      },      
      { new: true }
    );
    if(Shipment){
      return successResponse('Guia guardada')
    } else {
      throw new Error('No se encontró el envío');
    }
  } catch (error) {
    console.error('Error al guardar la guía:', error);
    throw error;
  }
}

module.exports = {
  createShipment, 
  shipmentProfit,
  getUserShipments,
  globalProfit,
  getAllShipments,
  payShipments,
  userPendingShipments,
  userShipments,
  detailShipment,
  getProfitPacking,
  saveGuide
};