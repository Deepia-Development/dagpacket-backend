const FedexService = require('../services/fedexService');
const {mapFedExResponse} = require('../utils/fedexResponseMapper');

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
      valor_declarado: req.body.valor_declarado
    };    

    const fedexResponse = await FedexService.getQuote(inputData); 
    console.log('Respuesta de FedEx:', JSON.stringify(fedexResponse, null, 2));   

    const mappedResponse = mapFedExResponse(fedexResponse, inputData);   
    

    res.json({ paqueterias: fedexResponse.paqueterias });
  } catch (error) {
    console.error('Error en fedexController:', error);
    res.status(500).json({ 
      error: 'Error al obtener cotización de FedEx', 
      details: error.response ? error.response.data : error.message 
    });
  }
};

exports.createShipment = async (req, res) => {
  try {
    const shipmentDetails = req.body; // Asume que los detalles del envío vienen en el cuerpo de la solicitud
    console.log('Datos de entrada para crear envío FedEx:', JSON.stringify(shipmentDetails, null, 2));

    const fedexResponse = await FedexService.createShipment(shipmentDetails);

    console.log('Respuesta de creación de envío FedEx:', JSON.stringify(fedexResponse, null, 2));

    const processedResponse = {
      trackingNumber: fedexResponse.output.transactionShipments[0].masterTrackingNumber,
      labelUrl: fedexResponse.output.transactionShipments[0].pieceResponses[0].labelDocuments[0].url,      
    };

    res.json(processedResponse);
  } catch (error) {
    console.error('Error al crear envío FedEx:', error);
    res.status(500).json({ 
      error: 'Error al crear envío FedEx', 
      details: error.response ? error.response.data : error.message 
    });
  }
};