const CancellationService = require("../services/CancellationRequestService");

async function createCancellationRequest(req, res) {
  try {
    const cancellation = await CancellationService.createCancellationRequest(
      req
    );
    res.status(cancellation.success ? 201 : 400).json(cancellation);
  } catch (error) {
    console.error(
      "Error en el controlador al crear solicitud de cancelación:",
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getCancellationRequestsById(req, res) {
  try {
    const cancellations = await CancellationService.getCancellationById(
      req
    );

    if (cancellations.success) {
      res.status(200).json(cancellations);
    } else {
      res.status(204).json(cancellations);
    }
  } catch (error) {
    console.error(
      "Error en el controlador al obtener solicitudes de cancelación:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Error interno del servidor al obtener solicitudes de cancelación",
    });
  }
}

async function getCancellationRequests(req, res) {
  try {
    const cancellations = await CancellationService.getCancellationRequests(
      req
    );

    if (cancellations.success) {
      res.status(200).json(cancellations);
    } else {
      res.status(204).json(cancellations);
    }
  } catch (error) {
    console.error(
      "Error en el controlador al obtener solicitudes de cancelación:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Error interno del servidor al obtener solicitudes de cancelación",
    });
  }
}

async function getAllCancellationRequests(req, res) {
  try {
    const cancellations = await CancellationService.getAllCancellationRequests(
      req
    );

    if (cancellations.success) {
      res.status(200).json(cancellations);
    } else {
      res.status(204).json(cancellations);
    }
  } catch (error) {
    console.error(
      "Error en el controlador al obtener todas las solicitudes de cancelación:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Error interno del servidor al obtener todas las solicitudes de cancelación",
    });
  }
}

async function updateCancellationRequest(req, res) {
  try {
    const result = await CancellationService.updateCancellationRequest(req);
    console.log("result", result);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error(
      "Error en el controlador al actualizar solicitud de cancelación:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
}

module.exports = {
  createCancellationRequest,
  getCancellationRequests,
  updateCancellationRequest,
  getAllCancellationRequests,
  getCancellationRequestsById,
};
