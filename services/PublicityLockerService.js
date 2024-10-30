const PublicityModel = require('../models/PublicityModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');


async function createPublicity(req) {


    const {locker_id, publicity,description} = req.body;
    

    try{

        const Publicity = new PublicityModel({
            locker_id,
            publicity,
            description
        });

        await Publicity.save();
        return successResponse('Publicidad creada correctamente');
    }catch(error){
        console.error('Error en createPublicity service:', error);
        return errorResponse('Error al crear la publicidad: ' + error.message);
    }
};

module.exports = {
    createPublicity
};