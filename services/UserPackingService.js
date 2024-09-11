const UserPackingModel = require('../models/UserPackingModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function restockUserInventory(req) {
    try {
        const { userId, packingId, quantity } = req.body;        
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

async function getUserInventory(req) {
    try {
        const { user_id } = req.params;
        const userInventory = await UserPackingModel.find({ user_id })
            .populate({
                path: 'inventory.packing_id',
                model: 'Packing',
                select: 'name sell_price type description image weigth height width length'
            });

        if (userInventory && userInventory.length > 0) {
            const formattedInventory = userInventory.map(inv => {
                const invObject = inv.toObject();
                return {
                    ...invObject,
                    inventory: invObject.inventory.map(item => {
                        if (item.packing_id) {
                            const { image, ...packingWithoutImage } = item.packing_id;
                            const imageBase64 = image ? image.toString('base64') : null;
                            const imageUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;

                            return {
                                ...item,
                                packing_id: {
                                    ...packingWithoutImage,                                   
                                    weigth: item.packing_id.weigth,
                                    height: item.packing_id.height,
                                    width: item.packing_id.width,
                                    length: item.packing_id.length,
                                    imageUrl: imageUrl,
                                }
                            };
                        }
                        return item;
                    })
                };
            });

            return dataResponse('Inventario de usuario', formattedInventory);
        } else {
            return dataResponse('No se encontró inventario para este usuario', []);
        }
    } catch (error) {
        console.error('Error al obtener el inventario del usuario:', error);
        return errorResponse('Ocurrió un error al obtener el inventario del usuario', error.message);
    }
}

module.exports = {
    restockUserInventory,
    getUserInventory
}