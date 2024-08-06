const ShipmentService = require('../services/ShipmentService');

async function create(req, res){
    try {
        const Shipment = await ShipmentService.createShipment(req, res);
        res.status(200).json(Shipment)
    } catch (error) {
        res.status(400).json({ message: error.message })
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

async function getUserShipments(req, res) {
    try {
        const shipmentResponse = await ShipmentService.getUserShipments(req);
        
        if (shipmentResponse.success) {
            res.status(200).json(shipmentResponse);
        } else {
            res.status(404).json(shipmentResponse);
        }
    } catch (error) {
        console.error('Error en getUserShipments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al obtener los envíos del usuario' 
        });
    }
}

async function getAllShipments(req, res) {
    try {
        const shipmentResponse = await ShipmentService.getAllShipments(req);
        
        if (shipmentResponse.success) {
            res.status(200).json(shipmentResponse);
        } else {
            res.status(404).json(shipmentResponse);
        }
    } catch (error) {
        console.error('Error en getAllShipments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al obtener todos los envíos' 
        });
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

async function detailsShipment(req, res){
    try {
        const Shipment = await ShipmentService.detailShipment(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getProfitPacking(req, res){
    try {
        const Shipment = await ShipmentService.getProfitPacking(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function saveGuide(req, res){
    try {
        const result = await ShipmentService.saveGuide(req);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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
    userShipments,
    detailsShipment,
    getProfitPacking,
    saveGuide
}