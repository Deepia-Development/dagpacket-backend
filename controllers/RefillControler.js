const refillRequestService = require('../services/RefillRequestService');

async function createRefillRequest(req, res) {
    try {
        const result = await refillRequestService.createRefillRequest(req);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function approveRefillRequest(req, res) {
    try {
        const result = await refillRequestService.approveRefillRequest(req);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function rejectRefillRequest(req, res) {
    try {
        const result = await refillRequestService.rejectRefillRequest(req);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

// Función adicional para obtener las solicitudes de reabastecimiento
async function getRefillRequests(req, res) {
    try {
        const result = await refillRequestService.getRefillRequests(req);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function getRefillRequests(req, res) {
    try {
        const result = await refillRequestService.getRefillRequests(req);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error en getRefillRequests controller:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}


module.exports = {
    createRefillRequest,
    approveRefillRequest,
    rejectRefillRequest,
    getRefillRequests
};