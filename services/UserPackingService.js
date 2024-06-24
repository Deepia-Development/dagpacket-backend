const UserPackingModel = require('../models/UserPackingModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function restockUserInventory(req) {
    try {
        const { userId, packingId, quantity } = req.body;

        // Verificar que la cantidad sea un número positivo
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return errorResponse('La cantidad debe ser un número entero positivo');
        }

        // Buscar el inventario del usuario o crear uno nuevo si no existe
        let userInventory = await UserPackingModel.findOne({ user_id: userId });

        if (!userInventory) {
            userInventory = new UserPackingModel({
                user_id: userId,
                inventory: []
            });
        }
        // Buscar el empaque específico en el inventario del usuario
        const packingIndex = userInventory.inventory.findIndex(
            item => item.packing_id.toString() === packingId
        );

        if (packingIndex === -1) {            
            userInventory.inventory.push({
                packing_id: packingId,
                quantity: quantity,
                last_restock_date: new Date()
            });
        } else {            
            userInventory.inventory[packingIndex].quantity += quantity;
            userInventory.inventory[packingIndex].last_restock_date = new Date();
        }

        // Guardar los cambios
        await userInventory.save();

        return successResponse('Inventario actualizado exitosamente', userInventory);
    } catch (error) {
        console.error('Error al reabastecer el inventario:', error);
        return errorResponse('Ocurrió un error al reabastecer el inventario');
    }
}

module.exports = {
    restockUserInventory
}