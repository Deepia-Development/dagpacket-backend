const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const RefillRequest = require("../models/RefillRequestModel");
const PackingTransactionModel = require("../models/PackingTransactionModel");
const TransactionModel = require("../models/TransactionsModel");
const CashRegisterModel = require("../models/CashRegisterModel");
const CashTransactionModel = require("../models/CashTransactionModel");
const UserPackingModel = require("../models/UserPackingModel");
const Wallet = require("../models/WalletsModel");
const User = require("../models/UsersModel");
const mongoose = require("mongoose");

async function createRefillRequest(req) {
  try {
    const { userId, packingId, quantityRequested, userNotes } = req.body;

    if (!Number.isInteger(quantityRequested) || quantityRequested <= 0) {
      return errorResponse(
        "La cantidad solicitada debe ser un número entero positivo"
      );
    }

    const newRequest = new RefillRequest({
      user_id: userId,
      packing_id: packingId,
      quantity_requested: quantityRequested,
      user_notes: userNotes,
    });

    await newRequest.save();
    return successResponse(
      "Solicitud de reabastecimiento creada exitosamente",
      newRequest
    );
  } catch (error) {
    console.error("Error al crear la solicitud de reabastecimiento:", error);
    return errorResponse(
      "Ocurrió un error al crear la solicitud de reabastecimiento"
    );
  }
}

async function createTransferRequest(req) {
  try {
    const { userId, packingId, quantity_transferred, admin_notes } = req.body;
    if (!Number.isInteger(quantity_transferred) || quantity_transferred <= 0) {
      return errorResponse(
        "La cantidad a transferir debe ser un número entero positivo"
      );
    }

    const newRequest = new RefillRequest({
      user_id: userId,
      packing_id: packingId,
      quantity_transferred,
      is_transfer: true,
      admin_notes: admin_notes,
    });

    await newRequest.save();

    return successResponse(
      "Solicitud de transferencia creada exitosamente",
      newRequest
    );
  } catch (error) {
    console.error("Error al crear la solicitud de transferencia:", error);
    return errorResponse(
      "Ocurrió un error al crear la solicitud de transferencia"
    );
  }
}

async function restockUserInventory(userId, packingId, quantity) {
  try {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("La cantidad debe ser un número entero positivo");
    }

    // Buscar el inventario del usuario o crear uno nuevo si no existe
    let userInventory = await UserPackingModel.findOne({ user_id: userId });

    if (!userInventory) {
      userInventory = new UserPackingModel({
        user_id: userId,
        inventory: [],
      });
    }

    // Buscar el empaque específico en el inventario del usuario
    const packingIndex = userInventory.inventory.findIndex(
      (item) => item.packing_id.toString() === packingId
    );

    if (packingIndex === -1) {
      userInventory.inventory.push({
        packing_id: packingId,
        quantity: quantity,
        last_restock_date: new Date(),
      });
    } else {
      userInventory.inventory[packingIndex].quantity += quantity;
      userInventory.inventory[packingIndex].last_restock_date = new Date();
    }

    // Guardar los cambios
    await userInventory.save();

    return userInventory;
  } catch (error) {
    console.error("Error al reabastecer el inventario:", error);
    throw error;
  }
}

async function approveRefillRequest(req) {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const refillRequest = await RefillRequest.findById(requestId);
    if (!refillRequest) {
      return errorResponse("Solicitud de reabastecimiento no encontrada");
    }

    if (refillRequest.status !== "pendiente") {
      return errorResponse("Esta solicitud ya ha sido procesada");
    }

    try {
      // Actualizar el inventario del usuario
      await restockUserInventory(
        refillRequest.user_id,
        refillRequest.packing_id,
        refillRequest.quantity_requested
      );
    } catch (error) {
      return errorResponse(
        "Error al actualizar el inventario: " + error.message
      );
    }

    // Actualizar el estado de la solicitud
    refillRequest.status = "aprobada";
    refillRequest.processed_date = new Date();
    refillRequest.admin_notes = adminNotes;
    await refillRequest.save();

    return successResponse(
      "Solicitud de reabastecimiento aprobada y procesada",
      refillRequest
    );
  } catch (error) {
    console.error("Error al aprobar la solicitud de reabastecimiento:", error);
    return errorResponse(
      "Ocurrió un error al aprobar la solicitud de reabastecimiento"
    );
  }
}

async function approveTransferRequest(req) {
  try {
    const { requestId } = req.params;

    const refillRequest = await RefillRequest.findById(requestId);
    if (!refillRequest) {
      return errorResponse("Solicitud de reabastecimiento no encontrada");
    }

    if (refillRequest.status !== "pendiente") {
      return errorResponse("Esta solicitud ya ha sido procesada");
    }
    try {
      await restockUserInventory(
        refillRequest.user_id,
        refillRequest.packing_id,
        refillRequest.quantity_transferred
      );
    } catch (error) {
      return errorResponse(
        "Error al actualizar el inventario: " + error.message
      );
    }

    refillRequest.status = "completada";
    refillRequest.processed_date = new Date();
    await refillRequest.save();

    return successResponse(
      "Solicitud de transferencia aprobada y procesada",
      refillRequest
    );
  } catch (error) {
    console.error("Error al aprobar la solicitud de transferencia:", error);
    return errorResponse(
      "Ocurrió un error al aprobar la solicitud de transferencia"
    );
  }
}

async function rejectRefillRequest(req) {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const refillRequest = await RefillRequest.findById(requestId);
    if (!refillRequest) {
      return errorResponse("Solicitud de reabastecimiento no encontrada");
    }

    if (refillRequest.status !== "pendiente") {
      return errorResponse("Esta solicitud ya ha sido procesada");
    }

    refillRequest.status = "rechazada";
    refillRequest.processed_date = new Date();
    refillRequest.admin_notes = adminNotes;
    await refillRequest.save();

    return successResponse(
      "Solicitud de reabastecimiento rechazada",
      refillRequest
    );
  } catch (error) {
    console.error("Error al rechazar la solicitud de reabastecimiento:", error);
    return errorResponse(
      "Ocurrió un error al rechazar la solicitud de reabastecimiento"
    );
  }
}


async function rejectTransferRequest(req) {
  try {
    const { requestId } = req.params;
    const { user_notes } = req.body;

    const refillRequest = await RefillRequest.findById(requestId);
    if (!refillRequest) {
      return errorResponse("Solicitud de transferencia no encontrada");
    }

    if (refillRequest.status !== "pendiente") {
      return errorResponse("Esta solicitud ya ha sido procesada");
    }

    refillRequest.status = "rechazada";
    refillRequest.processed_date = new Date();
    refillRequest.user_notes = user_notes;
    await refillRequest.save();

    return successResponse(
      "Solicitud de transferencia rechazada",
      refillRequest
    );
  } catch (error) {
    console.error("Error al rechazar la solicitud de transferencia:", error);
    return errorResponse(
      "Ocurrió un error al rechazar la solicitud de transferencia"
    );
  }
}

async function getRefillRequests(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
      search = "",
      status = "pendiente",
    } = req.query;

    // Incluimos la condición is_transfer junto con el status
    let query = {
      status,
      $or: [{ is_transfer: false }, { is_transfer: { $exists: false } }],
    };

    if (search) {
      // Combinamos la búsqueda con las condiciones existentes usando $and
      query = {
        $and: [
          query,
          {
            $or: [
              { "user_id.name": { $regex: search, $options: "i" } },
              { "packing_id.name": { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      populate: [
        { path: "user_id", select: "name email" },
        { path: "packing_id", select: "name type" },
      ],
      lean: true,
    };

    const result = await RefillRequest.paginate(query, options);

    const formattedRequests = result.docs.map((request) => ({
      _id: request._id,
      user: request.user_id
        ? {
            _id: request.user_id._id,
            name: request.user_id.name,
            email: request.user_id.email,
          }
        : null,
      packing: request.packing_id
        ? {
            _id: request.packing_id._id,
            name: request.packing_id.name,
            type: request.packing_id.type,
          }
        : null,
      quantity_requested: request.quantity_requested,
      requested_date: request.request_date,
      status: request.status,
      created_at: request.created_at,
      processed_date: request.processed_date,
      user_notes: request.user_notes,
      admin_notes: request.admin_notes,
      is_transfer: request.is_transfer, // Añadimos este campo a la respuesta
    }));

    return dataResponse(`Solicitudes de reabastecimiento - Estado: ${status}`, {
      requests: formattedRequests,
      totalPages: result.totalPages,
      currentPage: result.page,
      totalItems: result.totalDocs,
    });
  } catch (error) {
    console.error(
      "Error al obtener las solicitudes de reabastecimiento:",
      error
    );
    return errorResponse(
      "Error al obtener las solicitudes de reabastecimiento"
    );
  }
}

async function getUserRefillRequests(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
      search = "",
      status = "pendiente",
    } = req.query;
    const { userId } = req.params;

    // Modificamos el query para incluir is_transfer: false O que no exista
    let query = {
      user_id: userId,
      status,
      $or: [{ is_transfer: false }, { is_transfer: { $exists: false } }],
    };

    if (search) {
      // Añadimos la búsqueda como un $and para mantener la condición del $or anterior
      query = {
        $and: [
          query,
          { $or: [{ "packing_id.name": { $regex: search, $options: "i" } }] },
        ],
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      populate: [
        { path: "user_id", select: "name email" },
        { path: "packing_id", select: "name type" },
      ],
      lean: true,
    };

    const result = await RefillRequest.paginate(query, options);

    const formattedRequests = result.docs.map((request) => ({
      _id: request._id,
      packing: request.packing_id
        ? {
            _id: request.packing_id._id,
            name: request.packing_id.name,
            type: request.packing_id.type,
          }
        : null,
      quantity_requested: request.quantity_requested,
      requested_date: request.request_date,
      status: request.status,
      created_at: request.created_at,
      processed_date: request.processed_date,
      user_notes: request.user_notes,
      admin_notes: request.admin_notes,
      is_transfer: request.is_transfer,
    }));

    return dataResponse(
      `Solicitudes de reabastecimiento del usuario - Estado: ${status}`,
      {
        requests: formattedRequests,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalItems: result.totalDocs,
      }
    );
  } catch (error) {
    console.error(
      "Error al obtener las solicitudes de reabastecimiento del usuario:",
      error
    );
    return errorResponse(
      "Error al obtener las solicitudes de reabastecimiento del usuario"
    );
  }
}
async function getTransferRequests(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
      search = "",
      status = "pendiente", // Estado por defecto "pendiente"
    } = req.query;

    let query = { is_transfer: true, status }; // Filtra por transferencias y estado

    if (search) {
      query.$or = [
        { "user_id.name": { $regex: search, $options: "i" } },
        { "packing_id.name": { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      populate: [
        { path: "user_id", select: "name email" },
        { path: "packing_id", select: "name type" },
      ],
      lean: true,
    };

    const result = await RefillRequest.paginate(query, options);

    const formattedRequests = result.docs.map((request) => ({
      _id: request._id,
      user: request.user_id
        ? {
            _id: request.user_id._id,
            name: request.user_id.name,
            email: request.user_id.email,
          }
        : null,
      packing: request.packing_id
        ? {
            _id: request.packing_id._id,
            name: request.packing_id.name,
            type: request.packing_id.type,
          }
        : null,
      quantity_transferred: request.quantity_transferred,
      requested_date: request.request_date,
      status: request.status,
      created_at: request.created_at,
      processed_date: request.processed_date,
      user_notes: request.user_notes,
      admin_notes: request.admin_notes,
    }));

    return dataResponse(`Solicitudes de transferencia - Estado: ${status}`, {
      requests: formattedRequests,
      totalPages: result.totalPages,
      currentPage: result.page,
      totalItems: result.totalDocs,
    });
  } catch (error) {
    console.error("Error al obtener las solicitudes de transferencia:", error);
    return errorResponse("Error al obtener las solicitudes de transferencia");
  }
}

async function getAllUsersInventory(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
      search = "",
    } = req.query;

    let query = {};

    if (search) {
      query = {
        $or: [
          { "user_id.name": { $regex: search, $options: "i" } },
          { "inventory.packing_id.name": { $regex: search, $options: "i" } },
        ],
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      populate: [
        {
          path: "user_id",
          select: "name email role",
        },
        {
          path: "inventory.packing_id",
          select: "name type sell_price cost_price",
        },
      ],
      lean: true,
    };

    const result = await UserPackingModel.paginate(query, options);

    const formattedInventories = result.docs.map((userPacking) => ({
      _id: userPacking._id,
      user: userPacking.user_id
        ? {
            _id: userPacking.user_id._id,
            name: userPacking.user_id.name,
            email: userPacking.user_id.email,
            role: userPacking.user_id.role,
          }
        : null,
      inventory: userPacking.inventory.map((item) => ({
        _id: item._id,
        packing: item.packing_id
          ? {
              _id: item.packing_id._id,
              name: item.packing_id.name,
              type: item.packing_id.type,
              sell_price: item.packing_id.sell_price,
              cost_price: item.packing_id.cost_price,
            }
          : null,
        quantity: item.quantity,
        last_restock_date: item.last_restock_date,
      })),
      total_items: userPacking.inventory.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      total_value: userPacking.inventory.reduce((sum, item) => {
        if (item.packing_id && item.packing_id.sell_price) {
          return sum + item.quantity * item.packing_id.sell_price;
        }
        return sum;
      }, 0),
    }));

    return dataResponse("Inventario de todos los usuarios", {
      inventories: formattedInventories,
      totalPages: result.totalPages,
      currentPage: result.page,
      totalItems: result.totalDocs,
      summary: {
        total_users: result.totalDocs,
        total_inventory_value: formattedInventories.reduce(
          (sum, user) => sum + user.total_value,
          0
        ),
        total_items_count: formattedInventories.reduce(
          (sum, user) => sum + user.total_items,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error al obtener el inventario de los usuarios:", error);
    return errorResponse("Error al obtener el inventario de los usuarios");
  }
}

async function getUserTransferRequests(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
      search = "",
      status = "pendiente", // Estado por defecto "pendiente"
    } = req.query;
    const { userId } = req.params; // Obtener el userId desde los parámetros de la URL

    let query = { is_transfer: true, user_id: userId, status }; // Filtra por transferencias del usuario y estado

    if (search) {
      query.$or = [{ "packing_id.name": { $regex: search, $options: "i" } }];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      populate: [
        { path: "user_id", select: "name email" },
        { path: "packing_id", select: "name type" },
      ],
      lean: true,
    };

    const result = await RefillRequest.paginate(query, options);

    const formattedRequests = result.docs.map((request) => ({
      _id: request._id,
      packing: request.packing_id
        ? {
            _id: request.packing_id._id,
            name: request.packing_id.name,
            type: request.packing_id.type,
          }
        : null,
      quantity_transferred: request.quantity_transferred,
      requested_date: request.request_date,
      status: request.status,
      created_at: request.created_at,
      processed_date: request.processed_date,
      user_notes: request.user_notes,
      admin_notes: request.admin_notes,
    }));

    return dataResponse(
      `Solicitudes de transferencia del usuario - Estado: ${status}`,
      {
        requests: formattedRequests,
        totalPages: result.totalPages,
        currentPage: result.page,
        totalItems: result.totalDocs,
      }
    );
  } catch (error) {
    console.error(
      "Error al obtener las solicitudes de transferencia del usuario:",
      error
    );
    return errorResponse(
      "Error al obtener las solicitudes de transferencia del usuario"
    );
  }
}

async function sellPackage(req) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, packingId, quantity } = req.body;
    let firstUserRole;
    // Buscar el usuario con su inventario
    let user = await UserPackingModel.findOne({ user_id: userId })
      .session(session)
      .populate("inventory.packing_id");

    // Si el usuario no existe, se retorna un error
    if (!user) {
      return errorResponse("Usuario no encontrado");
    }

    let actualUserId = userId;
    if (user.role === "CAJERO" && user.parentUser) {
      firstUserRole = user.role;
      actualUserId = user.parentUser;
      user = await User.findById(actualUserId)
        .session(session)
        .lean()
        .populate("inventory.packing_id")
        .lean();
      if (!user) {
        return errorResponse("Usuario padre no encontrado");
      }
    } else {
      firstUserRole = user.role;
    }

    const wallet = await Wallet.findOne({ user: actualUserId }).session(
      session
    );

    if (!wallet) {
      return errorResponse("Usuario no tiene billetera");
    }

    // Buscar el empaque en el inventario del usuario

    // Buscar el índice del empaque en el inventario del usuario
    const packageIndex = user.inventory.findIndex(
      (item) => item.packing_id._id.toString() === packingId
    );

    // Si el empaque no está en el inventario, se retorna un error
    if (packageIndex === -1) {
      return errorResponse("El usuario no tiene este empaque en su inventario");
    }

    const newPackingTransaction = new PackingTransactionModel({
      user_id: actualUserId,
      sub_user_id: userId,
      price:
        parseFloat(
          user.inventory[packageIndex].packing_id.sell_price.toString()
        ) * quantity, // Precio total de los empaques vendidos
      cost:
        parseFloat(
          user.inventory[packageIndex].packing_id.cost_price.toString()
        ) * quantity, // Precio total de costo
      utilitie_lic: parseFloat(
        (
          (parseFloat(
            user.inventory[packageIndex].packing_id.sell_price.toString()
          ) -
            parseFloat(
              user.inventory[packageIndex].packing_id.cost_price.toString()
            )) *
          0.7 *
          quantity
        ) // Considera la cantidad vendida
          .toFixed(2)
      ),
      utilitie_dag: parseFloat(
        (
          (parseFloat(
            user.inventory[packageIndex].packing_id.sell_price.toString()
          ) -
            parseFloat(
              user.inventory[packageIndex].packing_id.cost_price.toString()
            )) *
          0.3 *
          quantity
        ) // Considera la cantidad vendida
          .toFixed(2)
      ),
      packing_id: packingId,
      quantity: quantity,
    });

    await newPackingTransaction.save({ session });

    // Actualizar el saldo de la billetera
    const sendBalance = parseFloat(wallet.sendBalance.toString());
    if (sendBalance < newPackingTransaction.price) {
      return errorResponse("Saldo insuficiente en la billetera");
    }

    const currentBalance = parseFloat(wallet.sendBalance); // El balance actual
    const transactionAmount = parseFloat(newPackingTransaction.price); // El monto de la transacción

    // Actualiza el balance
    wallet.sendBalance = (currentBalance - transactionAmount).toFixed(2);

    await wallet.save({ session });
    // Asigna el balance previo antes de la actualización
    const previous_balance = currentBalance;
    const new_balance = parseFloat(wallet.sendBalance);

    const newTransaction = new TransactionModel({
      user_id: actualUserId,
      licensee_id: userId,
      service: "Venta de empaque",
      transaction_number: Date.now().toString(),
      payment_method: "saldo",
      previous_balance: previous_balance,
      new_balance: new_balance,
      amount: transactionAmount,
      details: `Venta de ${quantity} empaques`,
      status: "Pagado",
    });

    await newTransaction.save({ session });

    let currentCashRegister;
    if (firstUserRole === "CAJERO") {
      currentCashRegister = await CashRegisterModel.findOne({
        employee_id: userId,
        status: "Abierto",
      }).session(session);
    } else if (firstUserRole === "LICENCIATARIO_TRADICIONAL") {
      currentCashRegister = await CashRegisterModel.findOne({
        licensee_id: actualUserId,
        status: "open",
      }).session(session);
    } else {
      // Handle other roles or throw an error
      currentCashRegister = await CashRegisterModel.findOne({
        $or: [{ licensee_id: actualUserId }, { employee_id: actualUserId }],
        status: "open",
      }).session(session);
    }

    if (currentCashRegister) {
      // Registrar la transacción en la caja
      const cashTransaction = new CashTransactionModel({
        cash_register_id: currentCashRegister._id,
        transaction_id: newTransaction._id,
        operation_by: actualUserId,
        payment_method: paymentMethod,
        amount: totalPrice,
        type: "ingreso",
        transaction_number: newTransaction.transaction_number,
        description: `Pago de ${quantity} Empaques(s)`,
      });
      await cashTransaction.save({ session });

      // Actualizar el total de ventas de la caja
      currentCashRegister.total_sales += totalPrice;
      await currentCashRegister.save({ session });
    }

    // Verificar si el usuario tiene suficiente cantidad del empaque
    if (user.inventory[packageIndex].quantity < quantity) {
      return errorResponse("El usuario no tiene suficiente inventario");
    }

    // Actualizar la cantidad del empaque en el inventario del usuario
    user.inventory[packageIndex].quantity -= quantity;

    console.log(
      "user.inventory[packageIndex].quantity",
      user.inventory[packageIndex].quantity
    );
    console.log("quantity", quantity);

    // Actualizar el inventario del usuario en la base de datos
    await user.save({ session });
    await session.commitTransaction();

    // Retornar una respuesta exitosa
    return successResponse("Venta realizada con éxito");
  } catch (error) {
    console.error("Error al realizar la venta:", error);
    await session.abortTransaction();
    return errorResponse("Error al realizar la venta");
  } finally {
    session.endSession();
  }
}

module.exports = {
  createRefillRequest,
  approveRefillRequest,
  rejectRefillRequest,
  getRefillRequests,
  createTransferRequest,
  approveTransferRequest,
  getTransferRequests,
  getUserTransferRequests,
  getUserRefillRequests,
  sellPackage,
  rejectTransferRequest,
  getAllUsersInventory,
};
