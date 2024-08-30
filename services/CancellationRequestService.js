const CancellationsModel = require('../models/CancelationRequestModel');
const ShipmentsModel = require('../models/ShipmentsModel');
const UserModel = require('../models/UsersModel');
const mongoose = require('mongoose')
const WalletModel = require('../models/WalletsModel')
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
        const { page = 1, limit = 10, sortBy = 'requested_at', sortOrder = 'desc' } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
            populate: {
                path: 'user_id',
                select: 'name email'
            }
        };

        const cancellations = await CancellationsModel.paginate({ user_id: id }, options);

        if (cancellations.docs.length > 0) {
            return dataResponse('Cancelaciones', {
                cancellations: cancellations.docs,
                totalPages: cancellations.totalPages,
                currentPage: cancellations.page,
                totalCancellations: cancellations.totalDocs
            });
        }
        return successResponse('No hay solicitudes por el momento');
    } catch (error) {
        console.error('Error al obtener solicitudes de cancelación:', error);
        return errorResponse('Ocurrió un error al obtener las solicitudes: ' + error.message);
    }
}

async function getAllCancellationRequests(req) {
    try {
        const { page = 1, limit = 10, sortBy = 'requested_at', sortOrder = 'desc' } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
            populate: [
                { path: 'user_id', select: 'name email' },
                { path: 'shipment_id' }
            ]
        };

        const cancellations = await CancellationsModel.paginate({}, options);

        if (cancellations.docs.length > 0) {
            return dataResponse('Todas las Cancelaciones', {
                cancellations: cancellations.docs,
                totalPages: cancellations.totalPages,
                currentPage: cancellations.page,
                totalCancellations: cancellations.totalDocs
            });
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

            // Buscar la wallet del usuario
            const wallet = await WalletModel.findOne({ user: user._id }).session(session);

            if (!wallet) {
                await session.abortTransaction();
                session.endSession();
                return errorResponse('Wallet del usuario no encontrada');
            }

            // Convertir Decimal128 a número
            const refundAmount = parseFloat(shipment.price.toString());
            const currentSendBalance = parseFloat(wallet.sendBalance.toString());

            // Actualizar el saldo de envíos de la wallet
            wallet.sendBalance = new mongoose.Types.Decimal128((currentSendBalance + refundAmount).toFixed(2));
            await wallet.save({ session });

            // Actualizar el estado del envío a 'Cancelado'
            const updatedShipment = await ShipmentsModel.findByIdAndUpdate(
                shipment._id, 
                { status: 'Cancelado' }, 
                { new: true, session }
            );

            if (!updatedShipment) {
                await session.abortTransaction();
                session.endSession();
                return errorResponse('No se pudo actualizar el estado del envío');
            }
        }

        await session.commitTransaction();
        session.endSession();

        return dataResponse('Solicitud de cancelación actualizada', {
            cancellation: updatedCancellation,
            shipment: status === 'Aprobado' ? { status: 'Cancelado' } : null
        });
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