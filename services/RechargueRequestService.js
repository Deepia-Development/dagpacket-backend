const RechargeRequest = require("../models/RechargueRequest");
const User = require("../models/UsersModel");
const mongoose = require("mongoose");
const Transaction = require("../models/TransactionsModel");
const Wallet = require("../models/WalletsModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function createRechargeRequest(req) {
  try {
    const existingRequest = await RechargeRequest.findOne({
      referenceNumber: req.body.referenceNumber,
    });
    if (existingRequest) {
      return errorResponse("El número de referencia es de otra transacción");
    }

    const { referenceNumber, amount, paymentMethod, rechargeType } = req.body;
    const proofImage = req.file ? req.file.buffer : undefined;

    // Validar que rechargeType sea uno de los valores permitidos
    if (!["envios", "servicios", "recargas"].includes(rechargeType)) {
      return errorResponse("Tipo de recarga no válido");
    }

    const newRequest = new RechargeRequest({
      referenceNumber,
      user_id: req.user.user._id,
      amount,
      paymentMethod,
      proofImage,
      rechargeType,
    });

    const result = await newRequest.save();

    if (result) {
      return successResponse("Solicitud enviada");
    } else {
      return errorResponse("No se pudo crear la solicitud de recarga");
    }
  } catch (error) {
    console.error("Error en createRechargeRequest service:", error);
    return errorResponse(
      "Error al crear la solicitud de recarga: " + error.message
    );
  }
}

async function countPendingRechargeRequests() {
  try {
    const totalPendingRequests = await RechargeRequest.countDocuments({ 
      status: "pendiente" 
    });
 
    return dataResponse("Total de solicitudes pendientes", {
      totalPendingRequests
    });
  } catch (error) {
    console.error("Error al contar solicitudes pendientes:", error);
    return errorResponse("Error al obtener el total: " + error.message);
  }
 }

async function getPendingRechargeRequests(
  page = 1,
  limit = 10,
  searchTerm = "",
  userId = null
 ) {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
 
    let filter = {
      status: "Pendiente"
    };
 
    if (userId) {
      filter.user_id = userId;
    }
 
    if (searchTerm) {
      filter.$or = [
        { referenceNumber: { $regex: searchTerm, $options: "i" } },
        { "user_id.name": { $regex: searchTerm, $options: "i" } },
        { "user_id.email": { $regex: searchTerm, $options: "i" } },
      ];
    }
 
    const total = await RechargeRequest.countDocuments(filter);
 
    const requests = await RechargeRequest.find(filter)
      .populate("user_id", "name email")
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
 
    const formattedRequests = requests.map((request) => {
      const formatted = { ...request };
      if (formatted.proofImage) {
        formatted.proofImage = formatted.proofImage.toString("base64");
      }
      return formatted;
    });
 
    return dataResponse("Solicitudes de recarga pendientes recuperadas con éxito", {
      requests: formattedRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
    });
  } catch (error) {
    console.error("Error en getPendingRechargeRequests service:", error);
    return errorResponse(
      "Error al obtener las solicitudes de recarga pendientes: " + error.message
    );
  }
 }
async function getRechargeRequests(
  page = 1,
  limit = 10,
  searchTerm = '',
  userId = null
) {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let filter = {};
    if (userId) {
      // Asegúrate de que userId sea un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return errorResponse('ID de usuario inválido');
      }
      filter.user_id = userId;
    }

    if (searchTerm) {
      filter.$or = [
        { referenceNumber: { $regex: searchTerm, $options: 'i' } },
        { 'user_id.name': { $regex: searchTerm, $options: 'i' } },
        { 'user_id.email': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const total = await RechargeRequest.countDocuments(filter);

    const requests = await RechargeRequest.find(filter)
      .populate('user_id', 'name email')
      .populate('approvedBy', 'name surname email')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedRequests = requests.map((request) => {
      // Crear un nuevo objeto con los datos seguros
      const formattedRequest = {
        ...request,
        // Convertir la imagen si existe
        proofImage: request.proofImage ? request.proofImage.toString('base64') : null,
        // Manejar approvedBy de manera segura
        approvedBy: request.approvedBy ? {
          _id: request.approvedBy._id,
          name: request.approvedBy.name || '',
          surname: request.approvedBy.surname || '',
          email: request.approvedBy.email || ''
        } : null
      };

      // Debug seguro
      if (formattedRequest.approvedBy) {
        console.log(`Aprobado por: ${formattedRequest.approvedBy.name} ${formattedRequest.approvedBy.surname} (${formattedRequest.approvedBy.email})`);
      } else {
        console.log('Solicitud sin aprobador asignado');
      }

      return formattedRequest;
    });

    return dataResponse('Solicitudes de recarga recuperadas con éxito', {
      requests: formattedRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
    });
  } catch (error) {
    console.error('Error en getRechargeRequests service:', error);
    return errorResponse(
      'Error al obtener las solicitudes de recarga: ' + error.message
    );
  }
}

async function getRechargeRequestsByUserId(
  page = 1,
  limit = 10,
  searchTerm = "",
  userId = null,
) {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let filter = {};

    if (userId) {
      filter.user_id = userId;
    }

    if (searchTerm) {
      filter.$or = [
        { referenceNumber: { $regex: searchTerm, $options: "i" } },
        { "user_id.name": { $regex: searchTerm, $options: "i" } },
        { "user_id.email": { $regex: searchTerm, $options: "i" } },
      ];
    }

    const total = await RechargeRequest.countDocuments(filter);

    const requests = await RechargeRequest.find(filter)
      .populate("user_id", "name email")
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Solicitudes de recarga:", requests);

    const formattedRequests = requests.map((request) => {
      const formatted = { ...request };
      if (formatted.proofImage) {
        formatted.proofImage = formatted.proofImage.toString("base64");
      }
      return formatted;
    });

    return dataResponse("Solicitudes de recarga recuperadas con éxito", {
      requests: formattedRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
    });
  } catch (error) {
    console.error("Error en getRechargeRequests service:", error);
    return errorResponse(
      "Error al obtener las solicitudes de recarga: " + error.message
    );
  }
}

async function addFundsToWallet(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user_id, amount, rechargeType } = req.body;
    console.log("Datos de la recarga:", user_id, amount, rechargeType);
    const user = await User.findById(user_id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Usuario no encontrado");
    }

    const wallet = await Wallet.findOne({ user: user._id }).session(session);

    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Wallet del usuario no encontrado");
    }

    const rechargeBalance = parseFloat(amount);
    let previousBalance, newBalance;

    switch (rechargeType) {
      case "envios":
        previousBalance = parseFloat(wallet.sendBalance.toString());
        console.log("Balance previo:", previousBalance);

        wallet.sendBalance = new mongoose.Types.Decimal128(
          (parseFloat(wallet.sendBalance.toString()) + rechargeBalance).toFixed(
            2
          )
        );
        newBalance = previousBalance + rechargeBalance;
        console.log("Balance nuevo:", newBalance);
        break;
      case "servicios":
        previousBalance = parseFloat(wallet.servicesBalance.toString());
        wallet.servicesBalance = new mongoose.Types.Decimal128(
          (
            parseFloat(wallet.servicesBalance.toString()) + rechargeBalance
          ).toFixed(2)
        );

        newBalance = previousBalance + rechargeBalance;
        console.log("Balance nuevo:", newBalance);

        break;
      case "recargas":
        previousBalance = parseFloat(wallet.rechargeBalance.toString());
        wallet.rechargeBalance = new mongoose.Types.Decimal128(
          (
            parseFloat(wallet.rechargeBalance.toString()) + rechargeBalance
          ).toFixed(2)
        );
        newBalance = previousBalance + rechargeBalance;

        break;
      default:
        await session.abortTransaction();
        session.endSession();
        return errorResponse("Tipo de recarga no válido");
    }

    const newTransaction = new Transaction({
      user_id: user._id,
      transaction_number: Date.now().toString(),
      service: "Abono a wallet",
      payment_method: "Transferencia",
      previous_balance: previousBalance.toFixed(2),
      new_balance: newBalance.toFixed(2),
      amount: rechargeBalance,
      details: `Abono de saldo (${rechargeType})`,
      status: "Pagado",
    });

    console.log(newTransaction);

    await wallet.save();
    await newTransaction.save();

    await session.commitTransaction();
    session.endSession();

    return successResponse("Fondos agregados al wallet con éxito");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error en addFundsToWallet:", error);
    return errorResponse("Error al agregar fondos al wallet: " + error.message);
  }
}

async function approveRechargeRequest(requestId, approvedBy) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await RechargeRequest.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Solicitud de recarga no encontrada");
    }

    if (request.status !== "pendiente") {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Esta solicitud ya ha sido procesada");
    }

    const user = await User.findById(request.user_id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Usuario no encontrado");
    }

    let walletOwner = user;
    let wallet = await Wallet.findOne({ user: user._id }).session(session);

    if (!wallet) {
      if (!user.parentUser) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse("El usuario no tiene wallet ni usuario padre");
      }

      const parentUser = await User.findById(user.parentUser).session(session);
      if (!parentUser) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse("Usuario padre no encontrado");
      }

      wallet = await Wallet.findOne({ user: parentUser._id }).session(session);
      if (!wallet) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse("Wallet del usuario padre no encontrada");
      }

      walletOwner = parentUser;
    }

    const rechargeAmount = parseFloat(request.amount.toString());
    let previousBalance, newBalance;

    switch (request.rechargeType) {
      case "envios":
        previousBalance = parseFloat(wallet.sendBalance.toString());
        wallet.sendBalance = new mongoose.Types.Decimal128((previousBalance + rechargeAmount).toFixed(2));
        newBalance = previousBalance + rechargeAmount;
        break;

      case "servicios":
        previousBalance = parseFloat(wallet.servicesBalance.toString());
        wallet.servicesBalance = new mongoose.Types.Decimal128((previousBalance + rechargeAmount).toFixed(2));
        newBalance = previousBalance + rechargeAmount;
        break;

      case "recargas":
        previousBalance = parseFloat(wallet.rechargeBalance.toString());
        wallet.rechargeBalance = new mongoose.Types.Decimal128((previousBalance + rechargeAmount).toFixed(2));
        newBalance = previousBalance + rechargeAmount;
        break;

      default:
        await session.abortTransaction();
        session.endSession();
        return errorResponse("Tipo de recarga no válido");
    }

    const newTransaction = new Transaction({
      user_id: walletOwner._id,
      transaction_number: Date.now().toString(),
      service: "Abono a wallet",
      payment_method: "Transferencia",
      previous_balance: previousBalance.toFixed(2),
      new_balance: newBalance.toFixed(2),
      amount: request.amount,
      details: `Recarga aprobada (${request.rechargeType})`,
      status: "Pagado",
    });

    await wallet.save();
    await newTransaction.save();

    request.status = "aprobada";
    request.processedDate = new Date();
    request.approvedBy = approvedBy; // ← aquí guardas quien aprobó

    await request.save();

    await session.commitTransaction();
    session.endSession();

    return successResponse("Recarga aprobada y balance actualizado");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error en approveRechargeRequest:", error);
    return errorResponse("Error al aprobar la recarga: " + error.message);
  }
}


async function rejectRechargeRequest(requestId, rejectionReason) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await RechargeRequest.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Solicitud de recarga no encontrada");
    }

    if (request.status !== "pendiente") {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Esta solicitud ya ha sido procesada");
    }

    request.status = "rechazada";
    request.processedDate = new Date();
    request.notes = rejectionReason;
    await request.save();

    await session.commitTransaction();
    session.endSession();

    return successResponse("Recarga rechazada");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error en rejectRechargeRequest:", error);
    return errorResponse("Error al rechazar la recarga: " + error.message);
  }
}

module.exports = {
  createRechargeRequest,
  getRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
  addFundsToWallet,
  getRechargeRequestsByUserId,
  getPendingRechargeRequests,
  countPendingRechargeRequests,
};