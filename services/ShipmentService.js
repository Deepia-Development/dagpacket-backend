const ShipmentsModel = require('../models/ShipmentsModel');
const UserPackingInventoryModel = require('../models/UserPackingModel');
const PackingModel = require('../models/PackingModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const mongoose = require('mongoose');
const UserModel = require('../models/UsersModel');

async function create(req) {
  try {
    const {
      user_id,      
      shipment_type,
      from,
      to,      
      payment_method,
      packing: requestPacking,
      shipment_data,
      insurance,
      cost,
      extra_price      
    } = req.body;

    let baseCost = parseFloat(cost);
    let packingCost = 0;
    let insuranceCost = parseFloat(insurance) || 0;
    let extraPrice = parseFloat(extra_price) || 0;
    
    // Obtener el usuario y sus porcentajes
    const user = await UserModel.findById(user_id);
    if (!user) {
      return errorResponse('Usuario no encontrado');
    }    

    const dagpacket_percentage = user.dagpacketPercentaje ? parseFloat(user.dagpacketPercentaje.toString()) : 0;

    let packing = {
      answer: 'No',
      packing_id: null,
      packing_type: 'None',
      packing_cost: 0,
      packing_category: 'None'
    };

    if (requestPacking && requestPacking.answer === 'Yes' && requestPacking.packing_id) {
      // Obtener el inventario del usuario
      const userInventory = await UserPackingInventoryModel.findOne({ user_id });
      
      if (!userInventory) {
        return errorResponse('No se encontró inventario para este usuario');
      }

      // Buscar el empaque específico en el inventario del usuario
      const packingInventory = userInventory.inventory.find(
        item => item.packing_id.toString() === requestPacking.packing_id.toString()
      );

      if (!packingInventory || packingInventory.quantity <= 0) {
        return errorResponse('No hay suficiente inventario de este empaque');
      }

      // Obtener información del empaque
      const packingInfo = await PackingModel.findById(requestPacking.packing_id);
      if (!packingInfo) {
        return errorResponse('Empaque no encontrado');
      }

      // Actualizar el inventario del usuario
      await UserPackingInventoryModel.findOneAndUpdate(
        { user_id, 'inventory.packing_id': requestPacking.packing_id },
        { $inc: { 'inventory.$.quantity': -1 } }
      );

      // Actualizar la información del empaque
      packing = {
        answer: 'Yes',
        packing_id: requestPacking.packing_id,
        packing_type: packingInfo.type,
        packing_cost: packingInfo.sell_price,
        packing_category: packingInfo.category
      };

      packingCost = parseFloat(packingInfo.sell_price);
    }

    // Calcular la utilidad de dagpacket basada en el costo base
    const dagpacket_profit = baseCost * (dagpacket_percentage / 100);
    let finalPrice = baseCost + packingCost + insuranceCost + extraPrice + dagpacket_profit;
    console.log(finalPrice);

    // La utilidad del licenciatario es el precio extra
    const licensee_profit = extraPrice;

    const newShipment = new ShipmentsModel({
      user_id,      
      shipment_type,
      from,
      to,      
      payment_method,
      packing,
      shipment_data,
      insurance: insuranceCost,
      cost: baseCost,
      price: finalPrice,
      extra_price: extraPrice,      
      licensee_profit,
      dagpacket_profit      
    });

    await newShipment.save();

    return successResponse('Envío creado exitosamente', newShipment);
  } catch (error) {
    console.error('Error al crear el envío:', error);
    return errorResponse('Ocurrió un error al crear el envío');
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

//Global prodfit for user 
async function globalProfit() {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; 

    const result = await ShipmentsModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$distribution_at" }, currentMonth]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: { $toDecimal: "$licensee_profit" } }
        }
      },
      {
        $project: {
          _id: 0,
          month: currentMonth,
          totalProfit: { $round: ["$totalProfit", 2] }
        }
      }
    ]);

    return successResponse({ monthlyProfit: result[0] || { month: currentMonth, totalProfit: 0 } });
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


module.exports = {
  create, 
  shipmentProfit,
  getUserShipments,
  globalProfit,
  getAllShipments,
  payShipments,
  userPendingShipments
};