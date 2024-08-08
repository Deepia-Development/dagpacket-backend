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

async function updatePacking(req) {
    try {
        const { id } = req.params;
        const { name, sell_price, cost_price, type, weigth, height, width, length, description } = req.body;
        const image = req.file ? req.file.buffer : undefined;

        const updateData = { name, sell_price, cost_price, type, weigth, height, width, length, description };
        if (image) {
            updateData.image = image;
        }

        const editPacking = await PackingModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (editPacking) {
            return successResponse('Empaque editado exitosamente', editPacking);
        } else {
            return errorResponse('No se encontró el empaque para editar');
        }
    } catch (error) {
        console.error('Error en updatePacking:', error);
        return errorResponse('Error interno del servidor: ' + error.message);
    }
}

async function listPacking(page = 1, limit = 10, search = '') {
    try {
        const skip = (page - 1) * limit;

        // Crear el objeto de filtro basado en el término de búsqueda
        const filter = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        // Contar el total de documentos que coinciden con el filtro
        const total = await PackingModel.countDocuments(filter);

        // Obtener los empaques paginados
        const packings = await PackingModel.find(filter)
            .skip(skip)
            .limit(limit)
            .lean();

        if (packings) {
            const packingsWithImages = packings.map(packing => ({
                _id: packing._id,
                name: packing.name,
                sell_price: packing.sell_price,
                cost_price: packing.cost_price,
                type: packing.type,
                weigth: packing.weigth,
                height: packing.height,
                width: packing.width,
                length: packing.length,
                description: packing.description,
                image: packing.image ? packing.image.toString('base64') : null
            }));

            return dataResponse('Empaques', {
                packings: packingsWithImages,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            });
        }
    } catch (error) {
        console.error('Error al listar los empaques:', error);
        return errorResponse('Error al listar los empaques');
    }
}

async function deletePacking(req) {
    try {
        const { id } = req.params;
        const packing = await PackingModel.findByIdAndDelete(id);

        if (packing) {
            return successResponse('Empaque eliminado con éxito', packing);
        } else {
            return errorResponse('Empaque no encontrado');
        }
    } catch (error) {
        console.error('Error al eliminar empaque:', error);
        return errorResponse('Error al procesar la solicitud');
    }
}
module.exports = {
    create, 
    listPacking,
    updatePacking,
    deletePacking
}