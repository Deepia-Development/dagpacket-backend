const TrackingModel = require('../models/TrackingModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper')


async function createTracking(req){
    try {
        const { shipment_id, title, area, description  } = req.body;
        const Tracking = await TrackingModel.create({
            shipment_id,
            title,            
            area,
            description
        })
        await Tracking.save();
        if(Tracking){
            return successResponse('Estado actualizado');
        }
    } catch (error) {
        console.log('Hubo un error al intentar actualizar la guia: ' + error);
        return errorResponse('Hubo un error al actualizar el rastreo')
    }
}

async function getTrackingShipment(req){
    try {
        const { id } = req.params;
        const Tracking = await TrackingModel.find({
            shipment_id: id
        })
        if(Tracking){
            return dataResponse('Actualizaciones de envio', Tracking);
        }
    } catch (error) {
        console.log('Ocurrio un error al obtener las actualizaciones' + error);
        return errorResponse('Ocuarrio un error al obtener las actualizaciones')
    }
}




module.exports = {
    createTracking,
    getTrackingShipment
}