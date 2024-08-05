const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const RefillRequest = require('../models/RefillRequestModel');
const UserPackingModel = require('../models/UserPackingModel')
const mongoose = require('mongoose')

async function createRefillRequest(req) {
    try {
        const { userId, packingId, quantityRequested, userNotes } = req.body;
        
        if (!Number.isInteger(quantityRequested) || quantityRequested <= 0) {
            return errorResponse('La cantidad solicitada debe ser un número entero positivo');
        }

        const newRequest = new RefillRequest({
            user_id: userId,
            packing_id: packingId,
            quantity_requested: quantityRequested,
            user_notes: userNotes
        });

        await newRequest.save();
        return successResponse('Solicitud de reabastecimiento creada exitosamente', newRequest);
    } catch (error) {
        console.error('Error al crear la solicitud de reabastecimiento:', error);
        return errorResponse('Ocurrió un error al crear la solicitud de reabastecimiento');
    }
}

async function restockUserInventory(userId, packingId, quantity) {
    try {
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('La cantidad debe ser un número entero positivo');
        }
        
        // Buscar el inventario del usuario o crear uno nuevo si no existe
        let userInventory = await UserPackingModel.findOne({ user_id: userId });

        if (!userInventory) {
            userInventory = new UserPackingModel({
                user_id: userId,
                inventory: []
            });
        }
        
        // Buscar el empaque específico en el inventario del usuario
        const packingIndex = userInventory.inventory.findIndex(
            item => item.packing_id.toString() === packingId
        );

        if (packingIndex === -1) {            
            userInventory.inventory.push({
                packing_id: packingId,
                quantity: quantity,
                last_restock_date: new Date()
            });
        } else {            
            userInventory.inventory[packingIndex].quantity += quantity;
            userInventory.inventory[packingIndex].last_restock_date = new Date();
        }
        
        // Guardar los cambios
        await userInventory.save();

        return userInventory;
    } catch (error) {
        console.error('Error al reabastecer el inventario:', error);
        throw error;
    }
}

async function approveRefillRequest(req) {
    try {
        const { requestId } = req.params;
        const { adminNotes } = req.body;
        
        const refillRequest = await RefillRequest.findById(requestId);
        if (!refillRequest) {
            return errorResponse('Solicitud de reabastecimiento no encontrada');
        }

        if (refillRequest.status !== 'pendiente') {
            return errorResponse('Esta solicitud ya ha sido procesada');
        }

        try {
            // Actualizar el inventario del usuario
            await restockUserInventory(
                refillRequest.user_id,
                refillRequest.packing_id,
                refillRequest.quantity_requested
            );
        } catch (error) {
            return errorResponse('Error al actualizar el inventario: ' + error.message);
        }

        // Actualizar el estado de la solicitud
        refillRequest.status = 'aprobada';
        refillRequest.processed_date = new Date();
        refillRequest.admin_notes = adminNotes;
        await refillRequest.save();

        return successResponse('Solicitud de reabastecimiento aprobada y procesada', refillRequest);
    } catch (error) {
        console.error('Error al aprobar la solicitud de reabastecimiento:', error);
        return errorResponse('Ocurrió un error al aprobar la solicitud de reabastecimiento');
    }
}

async function rejectRefillRequest(req) {
    try {
        const { requestId } = req.params;
        const {  adminNotes } = req.body;
        
        const refillRequest = await RefillRequest.findById(requestId);
        if (!refillRequest) {
            return errorResponse('Solicitud de reabastecimiento no encontrada');
        }

        if (refillRequest.status !== 'pendiente') {
            return errorResponse('Esta solicitud ya ha sido procesada');
        }

        refillRequest.status = 'rechazada';
        refillRequest.processed_date = new Date();
        refillRequest.admin_notes = adminNotes;
        await refillRequest.save();

        return successResponse('Solicitud de reabastecimiento rechazada', refillRequest);
    } catch (error) {
        console.error('Error al rechazar la solicitud de reabastecimiento:', error);
        return errorResponse('Ocurrió un error al rechazar la solicitud de reabastecimiento');
    }
}

async function getRefillRequests(req) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            // Asumiendo que quieres buscar por nombre de usuario o ID de empaque
            query = {
                $or: [
                    { 'user_id.name': { $regex: search, $options: 'i' } },
                    { 'packing_id.name': { $regex: search, $options: 'i' } }
                ]
            };
        }

        const total = await RefillRequest.countDocuments(query);

        const requests = await RefillRequest.find(query)
            .populate('user_id', 'name email')
            .populate('packing_id', 'name type')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const formattedRequests = requests.map(request => ({
            _id: request._id,
            user: request.user_id ? {
                _id: request.user_id._id,
                name: request.user_id.name,
                email: request.user_id.email
            } : null,
            packing: request.packing_id ? {
                _id: request.packing_id._id,
                name: request.packing_id.name,
                type: request.packing_id.type
            } : null,
            quantity_requested: request.quantity_requested,
            requested_date: request.request_date,
            status: request.status,
            created_at: request.created_at,
            processed_date: request.processed_date,
            user_notes: request.user_notes,
            admin_notes: request.admin_notes
        }));

        return dataResponse('Solicitudes de reabastecimiento', {
            requests: formattedRequests,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalItems: total
        });
    } catch (error) {
        console.error('Error al obtener las solicitudes de reabastecimiento:', error);
        return errorResponse('Error al obtener las solicitudes de reabastecimiento');
    }
}

module.exports = {
    createRefillRequest,
    approveRefillRequest,
    rejectRefillRequest,
    getRefillRequests    
}