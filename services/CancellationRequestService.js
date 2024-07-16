const CancellationsModel = require('../models/CancelationRequestModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function createCancellationRequest(req) {
    try {
        const { user_id, shipment_id, motive } = req.body;        

        const cancellation = new CancellationsModel({
            user_id, 
            shipment_id,
            motive            
        });
        await cancellation.save();
        if(cancellation){
            return successResponse('Solicitud creada');
        }
        return successResponse('Solicitud creada');
    } catch (error) {
        return errorResponse('Ocurrió un error: ' + error.message);
    }
}

async function getCancellationRequest(){
    try {
        const Cancellations = await CancellationsModel.find();
        if(Cancellations > 0){
            return dataResponse('Solicitudes de cancelaion', Cancellations)
        } else {
            return successResponse('No hay solicitudes de cancelation por el momento');
        }
    } catch (error) {
        return errorResponse('Ocurrio un error: ' + error)
    }
}

module.exports = {
    createCancellationRequest,
    getCancellationRequest
}