const ShipmentService = require('../services/ShipmentService');

async function create(req, res){
    try {
        const Shipment = await ShipmentService.create(req, res);
        res.status(200).json(Shipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
        const Shipment = await ShipmentService.payShipment(req, res);
        res.status(200).json(Shipment)
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
    payShipment
}