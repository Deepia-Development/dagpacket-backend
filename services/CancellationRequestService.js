const CancellationsModel = require('../models/CancelationRequestModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function createCancellationRequest(req) {
    try {
        const { user_id, shipment_id, motive } = req.body;

        if (!user_id || !shipment_id || !motive) {
            return errorResponse('Faltan campos requeridos');
        }

        const cancellation = new CancellationsModel({
            user_id,
            shipment_id,
            motive
        });

        const savedCancellation = await cancellation.save();

        if (savedCancellation) {
            return dataResponse('Solicitud de cancelación creada exitosamente', savedCancellation);
        } else {
            return errorResponse('No se pudo crear la solicitud de cancelación');
        }
    } catch (error) {
        console.error('Error al crear solicitud de cancelación:', error);
        return errorResponse('Ocurrió un error al crear la solicitud: ' + error.message);
    }
}

async function getCancellationRequests(req) {
    try {
        const { id } = req.params;
        const Cancellations = await CancellationsModel.find({user_id: id })
        .populate('user_id', 'name email') // Asumiendo que quieres algunos detalles del usuario
        .sort({ requested_at: -1 }); 

        if(Cancellations){
            return dataResponse('Cancelaciones', Cancellations);
        }
        return successResponse('No hay solicitudes por el momento');
    } catch (error) {
        console.error('Error al obtener solicitudes de cancelación:', error);
        return errorResponse('Ocurrió un error al obtener las solicitudes: ' + error.message);
    }
}

async function updateCancellationRequest(req) {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body;

        if (!['Aprobado', 'Rechazado'].includes(status)) {
            return errorResponse('Estado no válido');
        }

        const updateData = { status };
        if (status === 'Rechazado' && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        }

        const updatedCancellation = await CancellationsModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedCancellation) {
            return errorResponse('Solicitud de cancelación no encontrada');
        }

        return dataResponse('Solicitud de cancelación actualizada', updatedCancellation);
    } catch (error) {
        console.error('Error al actualizar solicitud de cancelación:', error);
        return errorResponse('Ocurrió un error al actualizar la solicitud: ' + error.message);
    }
}

module.exports = {
    createCancellationRequest,
    getCancellationRequests,
    updateCancellationRequest
};