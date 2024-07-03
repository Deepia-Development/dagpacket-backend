const ShipmentService = require('../services/ShipmentService');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function create(req, res){
    try {
        const userId = req.params.userId; // Asumiendo que el ID del usuario viene en la URL
        const shipmentData = req.body;
    
        const newShipment = await createShipment(shipmentData, userId);
    
        res.status(201).json(await dataResponse('Envío creado exitosamente', newShipment));
      } catch (error) {
        console.error('Error al crear el envío:', error);
        res.status(400).json(await errorResponse(error.message));
      }
}

async function shipmentProfit(req, res){
    try {
        const Shipment = await ShipmentService.shipmentProfit(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getUserShipments(req, res){
    try {
        const Shipment = await ShipmentService.getUserShipments(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function globalProfit(req, res){
    try {
        const Shipment = await ShipmentService.globalProfit(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getAllShipments(req, res){
    try {
        const Shipment = await ShipmentService.getAllShipments(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function payShipment(req, res){
    try {
        const Shipment = await ShipmentService.payShipments(req, res);
        res.status(200).json(Shipment)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function pendingShipment(req, res){
    try {
        const Shipment = await ShipmentService.userPendingShipments(req, res);
        res.status(200).json(Shipment)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function userShipments(req, res){
    try {
        const Shipment = await ShipmentService.userShipments(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    create,
    shipmentProfit,
    getUserShipments,
    globalProfit,
    getAllShipments,
    payShipment,
    pendingShipment,
    userShipments
}