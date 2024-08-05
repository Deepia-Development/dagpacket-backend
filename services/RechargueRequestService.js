const RechargeRequest = require('../models/RechargueRequest');
const User = require('../models/UsersModel');
const mongoose = require('mongoose')
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function createRechargeRequest(req) {
  try {
    const existingRequest = await RechargeRequest.findOne({ referenceNumber: req.body.referenceNumber });
    if (existingRequest) {
      return errorResponse('El número de referencia es de otra transacción');
    }

    const { referenceNumber, amount, paymentMethod } = req.body;
    const proofImage = req.file ? req.file.buffer : undefined;

    const newRequest = new RechargeRequest({
      referenceNumber,
      user_id: req.user.user._id,
      amount,
      paymentMethod,
      proofImage
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
    const skip = (page - 1) * limit;
    let query = {};

    if (userId) {
      query.user_id = userId;
    }

    if (searchTerm) {
      query.$or = [
        { referenceNumber: { $regex: searchTerm, $options: 'i' } },
        { 'user_id.name': { $regex: searchTerm, $options: 'i' } },
        { 'user_id.email': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const totalRequests = await RechargeRequest.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / limit);

    const requests = await RechargeRequest.find(query)
      .populate('user_id', 'name email') // Asumiendo que quieres estos campos del usuario
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedRequests = requests.map(request => {
      const formatted = { ...request };
      if (formatted.proofImage) {
        // Convertir a base64 solo si es necesario mostrar la imagen en la lista
        // Si no, podrías omitir esto y cargar la imagen solo cuando se solicite ver el comprobante
        formatted.proofImage = formatted.proofImage.toString('base64');
      }
      return formatted;
    });

    return dataResponse('Solicitudes de recarga recuperadas con éxito', {
      requests: formattedRequests,
      currentPage: page,
      totalPages,
      totalRequests
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

    // Convertir Decimal128 a número
    const currentBalance = parseFloat(user.balance.toString());
    const rechargeAmount = parseFloat(request.amount.toString());

    user.balance = new mongoose.Types.Decimal128((currentBalance + rechargeAmount).toFixed(2));
    await user.save();

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
  try {
    const request = await RechargeRequest.findById(requestId);
    if (!request) {
      return errorResponse('Solicitud de recarga no encontrada');
    }

    if (request.status !== 'pendiente') {
      return errorResponse('Esta solicitud ya ha sido procesada');
    }

    request.status = 'rechazada';
    request.processedDate = new Date();
    request.notes = rejectionReason;
    await request.save();

    return successResponse('Recarga rechazada');
  } catch (error) {
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