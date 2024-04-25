const ServicesModel = require('../models/ServicesModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');


async function createService(req){
    try {
        const { 
            user_id, 
            service, 
            date, 
            reference_number, 
            auth_number, 
            mount, 
            status } = req.body;
        const Service = await ServicesModel.create({
            user_id, 
            service, 
            date, 
            reference_number, 
            auth_number, 
            mount, 
            status
        })        
        if(Service){
            return successResponse('Pago de servicio guardado')
        }
    } catch (error) {
        console.log('No se pudo guardar el registro: ' + error );
        return errorResponse('No se pudo guardar el registro')
    }
}

async function getUserService(req){
    try {
        const { id } = req.params;
        const Service = await ServicesModel.find({user_id: id});
        if(Service){
            return dataResponse('Historial de servicios', Service)
        }
    } catch (error) {
        console.log('No se pudo obtener el historial de pagos: ' + error);
        return errorResponse('No se pudo obtener el historial de pagos')
    }
}

async function getAllServices(){
    try {
        const Shipment = await ServicesModel.find();
        if(Shipment) {
            return dataResponse('Historial de servicios', Shipment)
        }
    } catch (error) {
        console.log('No se pudo obtener el historial de servicios: ' + error);
        return errorResponse('No se pudo obtener el historial de servicios')
    }
}

module.exports = {
    createService,
    getUserService,
    getAllServices
}