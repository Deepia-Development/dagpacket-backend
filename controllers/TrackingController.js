const TrackingService = require('../services/TrackingService');

async function createTracking(req, res){
    try {
        const Tracking = await TrackingService.createTracking(req, res);
        res.status(200).json(Tracking);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getTrackingShipment(req, res){
    try {
        const Tracking = await TrackingService.getTrackingShipment(req, res);
        res.status(200).json(Tracking);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}



module.exports = {
    createTracking,
    getTrackingShipment
}