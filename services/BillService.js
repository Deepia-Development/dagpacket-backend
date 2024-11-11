const BillModel = require("../models/BillModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function createBill(req) {
  try {
    const { shipment_ids, bill_number, id } = req.body;

    if (!id) {
      return errorResponse("El id del usuario es requerido");
    }

    if (!shipment_ids || !bill_number) {
      return errorResponse("Faltan campos requeridos");
    }

    const bill = new BillModel({
      user_id: id,
      shipment_ids,
      bill_number,
      status: false,
    });

    const savedBill = await bill.save();

    if (savedBill) {
      return dataResponse("Factura creada exitosamente", savedBill);
    }

    return errorResponse("No se pudo crear la factura");
  } catch (error) {
    console.error("Error al crear la factura:", error);
    return errorResponse(
      "Ocurrió un error al crear la factura: " + error.message
    );
  }
}

async function getBills(req) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const bills = await BillModel.find({ user_id: id })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BillModel.countDocuments({ user_id: id });
    const totalPages = Math.ceil(total / limit);

    return dataResponse({
      bills,
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las facturas");
  }
}

async function getBillById(req) {
  try {
    const { id } = req.params;

    const bill = await BillModel.findById(id);

    if (bill) {
      return dataResponse("Factura", bill);
    }

    return errorResponse("No se encontró la factura");
  } catch (error) {
    console.error("Error al obtener la factura:", error);
    return errorResponse(
      "Ocurrió un error al obtener la factura: " + error.message
    );
  }
}



async function updateBill(req) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedBill = await BillModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (updatedBill) {
      return dataResponse("Factura actualizada", updatedBill);
    }

    return errorResponse("No se pudo actualizar la factura");
  } catch (error) {
    console.error("Error al actualizar la factura:", error);
    return errorResponse(
      "Ocurrió un error al actualizar la factura: " + error.message
    );
  }
}

async function deleteBill(req) {
  try {
    const { id } = req.params;

    const deletedBill = await BillModel.findByIdAndDelete(id);

    if (deletedBill) {
      return successResponse("Factura eliminada exitosamente");
    }
    return errorResponse("No se pudo eliminar la factura");
  } catch (error) {
    console.error("Error al eliminar la factura:", error);
    return errorResponse(
      "Ocurrió un error al eliminar la factura: " + error.message
    );
  }
}

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
};
