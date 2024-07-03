const ShipmentsModel = require('../models/ShipmentsModel');
const UserPackingInventoryModel = require('../models/UserPackingModel');
const PackingModel = require('../models/PackingModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const mongoose = require('mongoose');
const UserModel = require('../models/UsersModel');

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
      dagpacket_profit
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
      dagpacket_profit
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
    const result = await ShipmentsModel.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: { $toDecimal: "$licensee_profit" } }
        }
      },
      {
        $project: {
          _id: 0,
          totalProfit: { $round: ["$totalProfit", 2] }
        }
      }
    ]);
    
    if (result.length === 0) {
      return errorResponse('No se encontraron envíos para el usuario especificado');
    }

    const totalProfit = result[0].totalProfit;    
    return successResponse({ totalProfit });    
  } catch (error) {
    console.log('No se pudo calcular la ganancia total: ' + error);
    return errorResponse('No se pudo calcular la ganancia total');
  }
}


async function getUserShipments(req){
  try {
    const { id } = req.params;
    const Shipment = await ShipmentsModel.find({
      user_id: id
    })
    if(Shipment.length === 0){
      return errorResponse('No se econtraron envios')
    }
    return dataResponse('Envios', Shipment)
  } catch (error) {
    console.log('No se pudieorn obtener los envios: ' + error );
    return errorResponse('Error al obtener los envios')
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
  try {
    const { ids } = req.body; // Obtener el arreglo de IDs de paquetes desde el cuerpo de la solicitud    
    const shipments = await ShipmentsModel.find({ _id: { $in: ids } });

    if (shipments.length === 0) {
      return errorResponse('No se encontraron envíos pendientes de pago');
    }
    const user_id = shipments[0].user_id;

    // Buscar al usuario por su ID
    const user = await UserModel.findById(user_id);

    if (!user) {
      return errorResponse('Usuario no encontrado');
    }
    let totalPrice = 0;
    for (const shipment of shipments) {
      if (shipment.payment_status === 'Pagado') {
        continue; 
      }
      totalPrice += parseFloat(shipment.price);
    }
    const userBalance = parseFloat(user.balance);
    if (userBalance < totalPrice) {
      return errorResponse('Saldo insuficiente en la cuenta');
    }
    // Restar el precio total del saldo del usuario
    const newBalance = userBalance - totalPrice;
    user.balance = newBalance;

    // Actualizar el estado de pago de cada envío
    for (const shipment of shipments) {
      if (shipment.payment_status === 'Pagado') {
        continue; // Saltar el envío si ya ha sido pagado
      }
      shipment.payment_status = 'Pagado';
      await shipment.save();
    }
    
    await user.save();

    return successResponse('Envíos pagados exitosamente');
  } catch (error) {
    console.log('Error al pagar los envíos:', error);
    return errorResponse('Error al pagar los envíos');
  }
}

async function userPendingShipments(req){
  try {
    const { id } = req.params;
    const Shipment = await ShipmentsModel.find({user_id: id, payment_status: 'Pendiente'});
    if(Shipment) return dataResponse('Envio: ', Shipment) 
  } catch (error) {
    console.log('Error al obtener el carrito de compras' + error);
    return errorResponse('Error al obtener el carrito de compras')
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


module.exports = {
  createShipment, 
  shipmentProfit,
  getUserShipments,
  globalProfit,
  getAllShipments,
  payShipments,
  userPendingShipments,
  userShipments
};