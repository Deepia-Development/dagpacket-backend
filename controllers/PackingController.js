const PackingService = require('../services/PackingService');

async function create(req, res){
    try {
        const Packing = await PackingService.create(req, res);
        res.status(200).json(Packing)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listPacking(req, res){
    try {
        const Packing = await PackingService.listPacking(req, res);
        res.status(200).json(Packing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    create,
    listPacking
}