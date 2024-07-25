const PackingModel = require('../models/PackingModel');
const { errorResponse, successResponse, dataResponse } = require('../helpers/ResponseHelper');

async function create(req) {
    try {
        const { name, sell_price, cost_price, type, 
            weigth, height, width, length, 
            description } = req.body;

        if (!req.file) {
            return errorResponse('Debes proporcionar una iamgen')
        }

        const image = req.file.buffer;

        const newPacking = await PackingModel.create({
            image,
            name, sell_price, cost_price, type, 
            weigth, height, width, length, description
        });

        if (newPacking) {
            return successResponse('Empaque creado')    
        } else {
            return errorResponse('No se pudo guardar el empaque')
        }
    } catch (error) {
        return errorResponse('Internal server error: ' + error)        
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
            weigth: packing.weight,
            heigth: packing.heigth,
            width: packing.width,
            length: packing.length,
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