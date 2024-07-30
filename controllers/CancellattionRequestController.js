const CancellationService = require('../services/CancellationRequestService');

async function createCancellationRequest(req, res) {
    try {
        const cancellation = await CancellationService.createCancellationRequest(req);
        res.status(cancellation.success ? 201 : 400).json(cancellation);
    } catch (error) {
        console.error('Error en el controlador al crear solicitud de cancelación:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function getCancellationRequests(req, res) {
    try {
        const cancellations = await CancellationService.getCancellationRequests(req);
        res.status(cancellations.success ? 200 : 404).json(cancellations);
    } catch (error) {
        console.error('Error en el controlador al obtener solicitudes de cancelación:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function updateCancellationRequest(req, res) {
    try {
        const updatedCancellation = await CancellationService.updateCancellationRequest(req);
        res.status(updatedCancellation.success ? 200 : 400).json(updatedCancellation);
    } catch (error) {
        console.error('Error en el controlador al actualizar solicitud de cancelación:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

module.exports = {
    createCancellationRequest,
    getCancellationRequests,
    updateCancellationRequest
};