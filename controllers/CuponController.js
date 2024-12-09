const CuponService = require('../services/CuponService');


async function createCupon(req,res) {
    try {
        const result = await CuponService.createCupon(req);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        res.status(400).json(error);
    }
}

async function getAllCupon(req,res) {
    try {
        const result = await CuponService.getAllCupon(req);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json(error);
    }
}

async function getCuponById(req,res) {
    try {
        const result = await CuponService.getCuponById(req);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json(error);
    }
}

async function getCuponByUserId(req,res) {
    try {
        const result = await CuponService.getCuponByUserId(req);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json(error);
    }
}

async function updateCupon(req,res) {
    try {
        const result = await CuponService.updateCupon(req);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json(error);
    }
}

async function changeCuponStatus(req,res) {
    try{
        const result = await CuponService.changeCuponStatus(req);
        res.status(result.success ? 200 : 400).json(result);

    }catch(error){
        res.status(400).json(error);
    }
    
}




module.exports = {createCupon,getAllCupon,getCuponById,getCuponByUserId,updateCupon,changeCuponStatus};