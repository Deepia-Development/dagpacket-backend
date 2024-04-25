const ServicesService = require('../services/ServicesService');


async function create(req, res){
    try {
        const Service = await ServicesService.createService(req, res);
        res.status(200).json(Service);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getAllServices(req, res){
    try {
        const Services = await ServicesService.getAllServices(req, res);
        res.status(200).json(Services);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function getUserService(req, res){
    try {
        const Service = await ServicesService.getUserService(req, res);
        res.status(200).json(Service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    create,
    getAllServices,
    getUserService
}