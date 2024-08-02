const CancellationsModel = require('../models/CancelationRequestModel');
const ShipmentsModel = require('../models/ShipmentsModel');
const UserModel = require('../models/UsersModel');
const mongoose = require('mongoose')
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

async function getAllCancellationRequests(req) {
    try {
        const Cancellations = await CancellationsModel.find()
            .populate('user_id', 'name email')
            .populate('shipment_id', 'guide guide_number')
            .sort({ requested_at: -1 });

        if (Cancellations.length > 0) {
            return dataResponse('Todas las Cancelaciones', Cancellations);
        }
        return successResponse('No hay solicitudes de cancelación por el momento');
    } catch (error) {
        console.error('Error al obtener todas las solicitudes de cancelación:', error);
        return errorResponse('Ocurrió un error al obtener las solicitudes: ' + error.message);
    }
}

async function updateCancellationRequest(req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body;

        if (!['Aprobado', 'Rechazado'].includes(status)) {
            return errorResponse('Estado no válido');
        }

        const updateData = { status, resolved_at: new Date() };
        if (status === 'Rechazado') {
            if (!rejection_reason) {
                return errorResponse('Se requiere una razón de rechazo cuando el estado es Rechazado');
            }
            updateData.rejection_reason = rejection_reason;
        } else {
            updateData.rejection_reason = null;
        }

        const updatedCancellation = await CancellationsModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true, session }
        ).populate('shipment_id');

        if (!updatedCancellation) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse('Solicitud de cancelación no encontrada');
        }

        if (status === 'Aprobado') {
            const shipment = updatedCancellation.shipment_id;
            const user = await UserModel.findById(shipment.user_id).session(session);

            if (!user) {
                await session.abortTransaction();
                session.endSession();
                return errorResponse('Usuario no encontrado');
            }

            // Convertir Decimal128 a número
            const refundAmount = parseFloat(shipment.price.toString());
            const currentBalance = parseFloat(user.balance.toString());

            user.balance = new mongoose.Types.Decimal128((currentBalance + refundAmount).toFixed(2));
            await user.save({ session });

            // Actualizar el estado del envío
            await ShipmentsModel.findByIdAndUpdate(shipment._id, 
                { status: 'Cancelado' }, 
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return dataResponse('Solicitud de cancelación actualizada', updatedCancellation);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error al actualizar solicitud de cancelación:', error);
        return errorResponse('Ocurrió un error al actualizar la solicitud: ' + error.message);
    }
}



module.exports = {
    createCancellationRequest,
    getCancellationRequests,
    updateCancellationRequest,
    getAllCancellationRequests
};