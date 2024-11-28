const RechargeRequest = require('../models/RechargueRequest');
const User = require('../models/UsersModel');
const mongoose = require('mongoose')
const Transaction = require('../models/TransactionsModel')
const Wallet = require('../models/WalletsModel')
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function createRechargeRequest(req) {
  try {
    const existingRequest = await RechargeRequest.findOne({ referenceNumber: req.body.referenceNumber });
    if (existingRequest) {
      return errorResponse('El número de referencia es de otra transacción');
    }

    const { referenceNumber, amount, paymentMethod, rechargeType } = req.body;
    const proofImage = req.file ? req.file.buffer : undefined;

    // Validar que rechargeType sea uno de los valores permitidos
    if (!['envios', 'servicios', 'recargas'].includes(rechargeType)) {
      return errorResponse('Tipo de recarga no válido');
    }

    const newRequest = new RechargeRequest({
      referenceNumber,
      user_id: req.user.user._id,
      amount,
      paymentMethod,
      proofImage,
      rechargeType
    });

    const result = await newRequest.save();

    if (result) {
      return successResponse('Solicitud enviada');
    } else {
      return errorResponse('No se pudo crear la solicitud de recarga');
    }
  } catch (error) {
    console.error('Error en createRechargeRequest service:', error);
    return errorResponse('Error al crear la solicitud de recarga: ' + error.message);
  }
}

async function getRechargeRequests(page = 1, limit = 10, searchTerm = '', userId = null) {
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
        { referenceNumber: { $regex: searchTerm, $options: 'i' } },
        { 'user_id.name': { $regex: searchTerm, $options: 'i' } },
        { 'user_id.email': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const total = await RechargeRequest.countDocuments(filter);

    const requests = await RechargeRequest.find(filter)
      .populate('user_id', 'name email')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedRequests = requests.map(request => {
      const formatted = { ...request };
      if (formatted.proofImage) {
        formatted.proofImage = formatted.proofImage.toString('base64');
      }
      return formatted;
    });

    return dataResponse('Solicitudes de recarga recuperadas con éxito', {
      requests: formattedRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total
    });
  } catch (error) {
    console.error('Error en getRechargeRequests service:', error);
    return errorResponse('Error al obtener las solicitudes de recarga: ' + error.message);
  }
}

async function approveRechargeRequest(requestId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await RechargeRequest.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse('Solicitud de recarga no encontrada');
    }

    if (request.status !== 'pendiente') {
      await session.abortTransaction();
      session.endSession();
      return errorResponse('Esta solicitud ya ha sido procesada');
    }

    const user = await User.findById(request.user_id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse('Usuario no encontrado');
    }

    const wallet = await Wallet.findOne({ user: user._id }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse('Wallet del usuario no encontrado');
    }

    // Convertir Decimal128 a número
    const rechargeAmount = parseFloat(request.amount.toString());
    let previousBalance, newBalance;

    // Actualizar el saldo correspondiente en el wallet
    switch (request.rechargeType) {
      case 'envios':
        
        wallet.sendBalance = new mongoose.Types.Decimal128((parseFloat(wallet.sendBalance.toString()) + rechargeAmount).toFixed(2));
       previousBalance = parseFloat(wallet.sendBalance.toString());
        newBalance = parseFloat(wallet.sendBalance.toString()) + rechargeAmount
        break;
      case 'servicios':
        wallet.servicesBalance = new mongoose.Types.Decimal128((parseFloat(wallet.servicesBalance.toString()) + rechargeAmount).toFixed(2));
        previousBalance = parseFloat(wallet.servicesBalance.toString());
        newBalance = parseFloat(wallet.servicesBalance.toString()) + rechargeAmount
        break;
      case 'recargas':
        previousBalance = parseFloat(wallet.rechargeBalance.toString());
        newBalance = parseFloat(wallet.rechargeBalance.toString()) + rechargeAmount
        wallet.rechargeBalance = new mongoose.Types.Decimal128((parseFloat(wallet.rechargeBalance.toString()) + rechargeAmount).toFixed(2));
        break;
      default:
        await session.abortTransaction();
        session.endSession();
        return errorResponse('Tipo de recarga no válido');
    }

    const newTransaction = new Transaction({
      user_id: user._id,
      transaction_number: Date.now().toString(),
      payment_method: 'Transferencia',
      previous_balance: previousBalance.toFixed(2),
      new_balance: newBalance.toFixed(2),
      amount: request.amount,
      details: `Recarga aprobada (${request.rechargeType})`,
      status: 'Pagado'

    });
      


    console.log(newTransaction);
    await wallet.save();
    await newTransaction.save();

    request.status = 'aprobada';
    request.processedDate = new Date();
    await request.save();

    await session.commitTransaction();
    session.endSession();

    return successResponse('Recarga aprobada y balance actualizado');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error en approveRechargeRequest:', error);
    return errorResponse('Error al aprobar la recarga: ' + error.message);
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
      return errorResponse('Solicitud de recarga no encontrada');
    }

    if (request.status !== 'pendiente') {
      await session.abortTransaction();
      session.endSession();
      return errorResponse('Esta solicitud ya ha sido procesada');
    }

    request.status = 'rechazada';
    request.processedDate = new Date();
    request.notes = rejectionReason;
    await request.save();

    await session.commitTransaction();
    session.endSession();

    return successResponse('Recarga rechazada');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error en rejectRechargeRequest:', error);
    return errorResponse('Error al rechazar la recarga: ' + error.message);
  }
}


module.exports = {
  createRechargeRequest,
  getRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest
};