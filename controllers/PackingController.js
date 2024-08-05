const PackingService = require('../services/PackingService');

async function create(req, res){
    try {
        const Packing = await PackingService.create(req, res);
        res.status(200).json(Packing)
    } catch (error) {
        res.status(400).json({ message: error.message });
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

module.exports = {
    create,
    getPacking
}