// controllers/shippingController.js

const SuperEnviosService = require('../services/superEnviosService');
const FedexService = require('../services/fedexService');

// Importar la función de mapeo
const mapFedExResponse = require('../utils/fedexResponseMapper');

exports.getQuote = async (req, res) => {
  try {
    const quoteData = {
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

    console.log('Datos de entrada para cotización:', JSON.stringify(quoteData, null, 2));

    // Realizar cotizaciones en paralelo
    const [superEnviosQuote, fedexQuote] = await Promise.allSettled([
      SuperEnviosService.getQuote(quoteData),
      FedexService.getQuote(quoteData)
    ]);

    // Procesar y combinar las respuestas
    const response = {
      superenvios: processQuoteResult(superEnviosQuote, 'SuperEnvíos'),
      fedex: processFedExQuoteResult(fedexQuote, quoteData)
    };

    res.json(response);
  } catch (error) {
    console.error('Error en shippingController.getQuote:', error);
    res.status(500).json({ 
      error: 'Error al obtener las cotizaciones', 
      details: error.message 
    });
  }
};

function processQuoteResult(result, providerName) {
  if (result.status === 'fulfilled') {
    return {
      success: true,
      data: result.value
    };
  } else {
    console.error(`Error en cotización de ${providerName}:`, result.reason);
    return {
      success: false,
      error: `No se pudo obtener cotización de ${providerName}`,
      details: result.reason.message
    };
  }
}

function processFedExQuoteResult(result, inputData) {
  if (result.status === 'fulfilled') {
    const mappedResponse = mapFedExResponse(result.value, inputData);
    console.log('Respuesta mapeada de FedEx:', JSON.stringify(mappedResponse, null, 2));
    return {
      success: true,
      data: { paqueterias: mappedResponse }
    };
  } else {
    console.error('Error en cotización de FedEx:', result.reason);
    return {
      success: false,
      error: 'No se pudo obtener cotización de FedEx',
      details: result.reason.message
    };
  }
}

exports.createShipment = async (req, res) => {
  try {
    const { provider, ...shipmentData } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Se requiere especificar el proveedor' });
    }

    let shipment;
    switch (provider.toLowerCase()) {
      case 'superenvios':
        // Asumiendo que tienes un método createShipment en SuperEnviosService
        shipment = await SuperEnviosService.createShipment(shipmentData);
        break;
      case 'fedex':
        shipment = await FedexService.createShipment(shipmentData);
        break;
      default:
        return res.status(400).json({ error: 'Proveedor no soportado' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Error en shippingController.createShipment:', error);
    res.status(500).json({ 
      error: 'Error al crear el envío', 
      details: error.message 
    });
  }
};

exports.generateGuide = async (req, res) => {
    try {
      const { provider, ...shipmentData } = req.body;
      
      if (!provider) {
        return res.status(400).json({ error: 'Se requiere especificar el proveedor' });
      }
  
      let guideResponse;
      switch (provider.toLowerCase()) {
        case 'superenvios':
          guideResponse = await SuperEnviosService.generateGuide(shipmentData);
          break;
        case 'fedex':
          guideResponse = await FedexService.createShipment(shipmentData);
          break;
        default:
          return res.status(400).json({ error: 'Proveedor no soportado' });
      }
  
      res.json(guideResponse);
    } catch (error) {
      console.error('Error en shippingController.generateGuide:', error);
      res.status(500).json({ 
        error: 'Error al generar la guía', 
        details: error.message 
      });
    }
  };