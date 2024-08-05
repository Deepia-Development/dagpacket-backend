const rechargeRequestService = require('../services/RechargueRequestService');

async function createRechargeRequest(req, res) {
  try {
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

async function getRechargeRequests(req, res) {
  try {
    const userId = req.query.userId; // Si quieres filtrar por usuario
    const result = await rechargeRequestService.getRechargeRequests(userId);
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
  rejectRecharge
};