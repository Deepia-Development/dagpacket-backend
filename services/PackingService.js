const PackingModel = require("../models/PackingModel");
const WarehouseModel = require("../models/WarehouseModel");
const {
  errorResponse,
  successResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function create(req) {
  try {
    const {
      name,
      sell_price,
      cost_price,
      type,
      weigth,
      height,
      width,
      length,
      description,
    } = req.body;

    if (!req.file) {
      return errorResponse("Debes proporcionar una imagen");
    }

    const image = req.file.buffer;

    const newPacking = await PackingModel.create({
      image,
      name,
      sell_price,
      cost_price,
      type,
      weigth,
      height,
      width,
      length,
      description,
    });

    if (newPacking) {
      // Buscar el almacén o crearlo si no existe
      let warehouse = await WarehouseModel.findOne();

      if (!warehouse) {
        warehouse = await WarehouseModel.create({
          name: "Almacén General",
          items: [],
        });
      }

      // Agregar el nuevo paquete al inventario con cantidad 0
      warehouse.stock.push({
        packing: newPacking._id,
        quantity: 0,
        lastUpdated: Date.now(),
      });

      // Guardar el almacén actualizado
      await warehouse.save();

      return successResponse(
        "Empaque creado y agregado al inventario con cantidad 0"
      );
    } else {
      return errorResponse("No se pudo guardar el empaque");
    }
  } catch (error) {
    console.error("Error completo:", error);
    return errorResponse("Internal server error: " + error.message);
  }
}

async function updatePackingQuantity(req) {
    try {
      const { packingId, quantity } = req.body;
  
      // Validar que quantity sea un número entero positivo
      if (!Number.isInteger(quantity) || quantity < 0) {
        return errorResponse("La cantidad debe ser un número entero positivo");
      }
  
      // Buscar el almacén
      const warehouse = await WarehouseModel.findOne();
      if (!warehouse) {
        return errorResponse("No se encontró el almacén");
      }
  
      // Buscar el empaque en el stock del almacén
      const packingItem = warehouse.stock.find(
        (item) => item.packing.toString() === packingId.toString()
      );
  
      if (!packingItem) {
        return errorResponse("El empaque no se encuentra en el inventario del almacén");
      }
  
      // Actualizar la cantidad de empaques
      packingItem.quantity = quantity;
      packingItem.last_entry = Date.now();
  
      // Guardar el almacén actualizado
      await warehouse.save();
  
      return successResponse("Cantidad de empaques actualizada exitosamente");
    } catch (error) {
      console.error("Error al actualizar la cantidad de empaques:", error);
      return errorResponse("Ocurrió un error al actualizar la cantidad de empaques");
    }
  }
  
async function getWarehouse(req) {
    try {
      const warehouse = await WarehouseModel.findOne()
        .populate('stock.packing'); // Usamos populate para obtener los detalles del packing
  
      if (warehouse) {
        return dataResponse("Almacén", warehouse);
      } else {
        return errorResponse("No se encontró el almacén");
      }
    } catch (error) {
      console.error("Error al obtener el almacén:", error);
      return errorResponse("Error al obtener el almacén");
    }
  }
  

async function updatePacking(req) {
  try {
    const { id } = req.params;
    const {
      name,
      sell_price,
      cost_price,
      type,
      weigth,
      height,
      width,
      length,
      description,
    } = req.body;
    const image = req.file ? req.file.buffer : undefined;

    const updateData = {
      name,
      sell_price,
      cost_price,
      type,
      weigth,
      height,
      width,
      length,
      description,
    };
    if (image) {
      updateData.image = image;
    }

    const editPacking = await PackingModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (editPacking) {
      return successResponse("Empaque editado exitosamente", editPacking);
    } else {
      return errorResponse("No se encontró el empaque para editar");
    }
  } catch (error) {
    console.error("Error en updatePacking:", error);
    return errorResponse("Error interno del servidor: " + error.message);
  }
}

async function listPacking(page = 1, limit = 10, search = "") {
  try {
    const skip = (page - 1) * limit;

    // Crear el objeto de filtro basado en el término de búsqueda
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    // Contar el total de documentos que coinciden con el filtro
    const total = await PackingModel.countDocuments(filter);

    // Obtener los empaques paginados
    const packings = await PackingModel.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    if (packings) {
      const packingsWithImages = packings.map((packing) => ({
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
        image: packing.image ? packing.image.toString("base64") : null,
      }));

      return dataResponse("Empaques", {
        packings: packingsWithImages,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total,
      });
    }
  } catch (error) {
    console.error("Error al listar los empaques:", error);
    return errorResponse("Error al listar los empaques");
  }
}

async function deletePacking(req) {
  try {
    const { id } = req.params;
    const packing = await PackingModel.findByIdAndDelete(id);

    if (packing) {
      return successResponse("Empaque eliminado con éxito", packing);
    } else {
      return errorResponse("Empaque no encontrado");
    }
  } catch (error) {
    console.error("Error al eliminar empaque:", error);
    return errorResponse("Error al procesar la solicitud");
  }
}

module.exports = {
  create,
  listPacking,
  updatePacking,
  deletePacking,
  getWarehouse,
    updatePackingQuantity,
};
