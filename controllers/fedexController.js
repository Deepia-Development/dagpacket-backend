const FedexService = require('../services/fedexService');
const mapFedExResponse = require('../utils/fedexResponseMapper');

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

    console.log('Datos de entrada FedEx:', JSON.stringify(inputData, null, 2));

    const fedexResponse = await FedexService.getQuote(inputData);
    console.log('Respuesta original de FedEx:', JSON.stringify(fedexResponse, null, 2));

    const mappedResponse = mapFedExResponse(fedexResponse, inputData);
    console.log('Respuesta mapeada de FedEx:', JSON.stringify(mappedResponse, null, 2));

    res.json({ paqueterias: mappedResponse });
  } catch (error) {
    console.error('Error en fedexController:', error);
    res.status(500).json({ 
      error: 'Error al obtener cotización de FedEx', 
      details: error.response ? error.response.data : error.message 
    });
  }
};