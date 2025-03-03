const PackingService = require('../services/PackingService');

async function create(req, res){
    try {
        const Packing = await PackingService.create(req, res);
        res.status(200).json(Packing)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getWarehouse(req, res){
    try {
        const warehouse = await PackingService.getWarehouse(req);
        res.status(200).json(warehouse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function updatePackingQuantity(req, res){
    try {
        const result = await PackingService.updatePackingQuantity(req);
        if(result.success){
            res.status(200).json(result)
        } else {
            res.status(204).json(result)
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' + error.message })
    }
}

async function getPacking(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const result = await PackingService.listPacking(page, limit, search);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error en getPacking controller:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function updatePacking(req, res) {
    try {
        const result = await PackingService.updatePacking(req);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error en packingController:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
    }
}

async function deletePacking(req, res){
    try {
        const result = await PackingService.deletePacking(req);
        if(result.success){
            res.status(200).json(result)
        } else {
            res.status(204).json(result)
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' + error.message })
    }
}

module.exports = {
    create,
    getPacking,
    updatePacking,
    deletePacking,
    getWarehouse,
    updatePackingQuantity
}