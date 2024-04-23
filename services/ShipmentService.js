const ShipmentsModel = require('../models/ShipmentsModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const mongoose = require('mongoose');

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


async function globalProfit(req) {
  try {
    const result = await ShipmentsModel.aggregate([
      {
        $group: {
          _id: { $month: "$distribution_at" }, // Agrupar por mes
          totalProfit: { $sum: { $toDecimal: "$licensee_profit" } }
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalProfit: { $round: ["$totalProfit", 2] } 
        }
      },
      { $sort: { month: 1 } } // Ordenar por mes
    ]);
    
    return successResponse({ monthlyProfits: result });
  } catch (error) {
    console.log('No se pudo calcular la ganancia global por mes: ' + error);
    return errorResponse('No se pudo calcular la ganancia global por mes');
  }
}


module.exports = {
  create, 
  shipmentProfit,
  getUserShipments,
  globalProfit
};