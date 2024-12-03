const rechargeRequestService = require('../services/RechargueRequestService');

async function createRechargeRequest(req, res) {
  try {
    // Asegurarse de que rechargeType esté presente en el cuerpo de la solicitud
    if (!req.body.rechargeType) {
      return res.status(400).json({ success: false, message: 'Se requiere especificar el tipo de recarga (envios, servicios, recargas)' });
    }
    
    const result = await rechargeRequestService.createRechargeRequest(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en createRechargeRequest controller:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function addFunds(req, res) {
  try {
    const result = await rechargeRequestService.addFundsToWallet(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en addFunds controller:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function getRechargeRequests(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const userId = req.query.userId || null; 

    console.log('userId:', userId);

    const result = await rechargeRequestService.getRechargeRequests(page, limit, searchTerm, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en getRechargeRequests controller:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}



async function approveRecharge(req, res) {
  try {
    const { requestId } = req.params;
    const result = await rechargeRequestService.approveRechargeRequest(requestId);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en approveRecharge controller:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function rejectRecharge(req, res) {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Se requiere un motivo de rechazo' });
    }
    const result = await rechargeRequestService.rejectRechargeRequest(requestId, rejectionReason);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en rejectRecharge controller:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

module.exports = {
  createRechargeRequest,
  getRechargeRequests,
  approveRecharge,
  rejectRecharge,
  addFunds
};