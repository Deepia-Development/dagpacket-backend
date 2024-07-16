const CancellationSerivce = require('../services/CancellationRequestService');

async function createCancellationRequest(req, res){
    try {
        const Cancellation = await CancellationSerivce.createCancellationRequest(req, res);
        res.status(200).json(Cancellation);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getCancellationRequest(req, res) {
    try {
        const Cancellation = await CancellationSerivce.getCancellationRequest(req, res);
        res.status(200).json(Cancellation)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    createCancellationRequest,
    getCancellationRequest
}