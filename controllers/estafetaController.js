const EstafetaService = require("../services/estafetaService");
const { mapEstafetaResponse } = require("../utils/estafetaMaper");

exports.getQuote = async (req, res) => {
  try {
    const inputData = {
      pais_origen: req.body.pais_origen,
      pais_destino: req.body.pais_destino,
      cp_origen: req.body.cp_origen,
      cp_destino: req.body.cp_destino,
      alto: req.body.alto,
      ancho: req.body.ancho,
      largo: req.body.largo,
      peso: req.body.peso,
      seguro: req.body.seguro,
      valor_declarado: req.body.valor_declarado,
    };

    const estafetaResponse = await EstafetaService.getQuote(inputData);

    const mappedResponse = mapEstafetaResponse(estafetaResponse, inputData);

    res.json({ paqueterias: mappedResponse });
  } catch (error) {
    console.error("Error en estafetaController:", error);
    res.status(500).json({
      error: "Error al obtener cotización de Estafeta",
      details: error.response ? error.response.data : error.message,
    });
  }
};

exports.createShipment = async (req, res) => {
  try {
    const shipmentDetails = req.body;
    console.log(
      "Datos de entrada para crear envío Estafeta:",
      JSON.stringify(shipmentDetails, null, 2)
    );

    const estafetaResponse = await EstafetaService.createShipment(
      shipmentDetails
    );

    console.log(
      "Respuesta de creación de envío Estafeta:",
      JSON.stringify(estafetaResponse, null, 2)
    );

    const processedResponse = {
      trackingNumber:
        estafetaResponse.output.transactionShipments[0].masterTrackingNumber,
      labelUrl:
        estafetaResponse.output.transactionShipments[0].pieceResponses[0]
          .labelDocuments[0].url,
    };

    res.json(processedResponse);
  } catch (error) {
    console.error("Error al crear envío Estafeta:", error);
    res.status(500).json({
      error: "Error al crear envío Estafeta",
      details: error.response ? error.response.data : error.message,
    });
  }
};
