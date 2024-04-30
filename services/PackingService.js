const PackingModel = require('../models/PackingModel');
const { errorResponse, successResponse, dataResponse } = require('../helpers/ResponseHelper');

async function create(req){
    try {
        
        const { name, sell_price, cost_price, type, description } = req.body;

        if (!req.file) {
            return errorResponse('No se ha proporcionado una imagen');
          }      
        const image = req.file.buffer;

        const Packing = await PackingModel.create({
            image, name, sell_price, cost_price, type, description
        });
        if(Packing){
            return successResponse('Empaque creado');
        }
    } catch (error) {
        console.log('Error: '+ error );
        return errorResponse('Error al crear el empaque');
    }
}

async function listPacking() {
    try {
      const packings = await PackingModel.find();
  
      if (packings) {
        const packingsWithImageUrls = packings.map(packing => ({
            name: packing.name,
            sell_price: packing.sell_price,
            cost_price: packing.cost_price,
            type: packing.type,
            description: packing.description,            
            imageUrl: `/image/${packing._id}`
        }));
  
        return dataResponse('Empaques', packingsWithImageUrls);
      }
    } catch (error) {
      console.log('Error: ' + error);
      errorResponse('Error al listar los empaques');
    }
}

module.exports = {
    create, 
    listPacking
}