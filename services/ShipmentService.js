const ShipmentsModel = require('../models/ShipmentsModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const mongoose = require('mongoose');
const UserModel = require('../models/UsersModel');

async function create(req) {
  try {
    const {
      user_id,
      distribution_at,
      shipment_type,
      from,
      to,      
      payment_method,
      packing,
      shipment_data,
      insurance,
      cost,
      price,
      status,
      licensee_percentage,
      licensee_profit,
      payment_status
    } = req.body;

    const newShipment = new ShipmentsModel({
      user_id,
      distribution_at,
      shipment_type,
      from,
      to,      
      payment_method,
      packing,
      shipment_data,
      insurance,
      cost,
      price,
      status,
      licensee_percentage,
      licensee_profit,
      payment_status
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
    const currentMonth = currentDate.getMonth() + 1; // Sumamos 1 porque los meses en JavaScript están basados en índice 0

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

async function payShipment(req) {
  try {
    const { id } = req.params;
    console.log(id);
    // Buscar el envío por su ID
    const shipment = await ShipmentsModel.findById(id);

    if (!shipment) {
      return errorResponse('Envio no encontrado')
    }

    const { user_id, price, payment_status } = shipment;    
    if (payment_status === 'Pagado') {
      return errorResponse('El envio ya ha sido pagado')
    }
    
    const user = await UserModel.findById(user_id);
    if (!user) {
      return errorResponse('Usuario no encontrado')
    }

    const userBalance = parseFloat(user.balance);
    const shipmentPrice = parseFloat(price);
    
    if (userBalance < shipmentPrice) {
      return errorResponse('Saldo insuficiente en la cuenta');
    }

    // Restar el precio del envío del saldo del usuario
    const newBalance = userBalance - shipmentPrice;
    user.balance = newBalance;

    // Actualizar el estado de pago del envío
    shipment.payment_status = 'Pagado';

    // Guardar los cambios en la base de datos
    await user.save();
    await shipment.save();

    return successResponse('Envio pagado exitosamente');
  } catch (error) {
    console.log('Error al obtener los envios' + error);
    return errorResponse('Error al pagar el envio')
  }
}


module.exports = {
  create, 
  shipmentProfit,
  getUserShipments,
  globalProfit,
  getAllShipments,
  payShipment
};