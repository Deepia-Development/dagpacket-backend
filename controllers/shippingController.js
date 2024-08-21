// controllers/shippingController.js

const { strategies } = require('../utils/shippingStrategy');
const { mapFedExResponse } = require('../utils/fedexResponseMapper');
const { mapPaqueteExpressResponse } = require('../utils/paqueteExpressMapper');
const config = require('../config/config');
const path = require('path');
const fs = require('fs').promises;

const LABEL_URL_BASE = `${config.backendUrl}/labels`;

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

    // Realizar cotizaciones en paralelo usando las estrategias
    const quotePromises = Object.entries(strategies).map(([provider, strategy]) => 
      strategy.getQuote(quoteData).then(result => [provider, result])
    );

    const quoteResults = await Promise.allSettled(quotePromises);

    // Procesar y combinar las respuestas
    const response = quoteResults.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        const [provider, quoteResult] = result.value;
        if (provider === 'fedex') {
          acc[provider] = processFedExQuoteResult({ status: 'fulfilled', value: quoteResult }, quoteData);
        } else if (provider === 'paqueteexpress') {
          acc[provider] = processPaqueteExpressQuoteResult({ status: 'fulfilled', value: quoteResult }, quoteData);
        } else {
          acc[provider] = processQuoteResult({ status: 'fulfilled', value: quoteResult }, provider);
        }
      } else {
        const provider = result.reason.provider || 'Unknown';
        acc[provider] = processQuoteResult({ status: 'rejected', reason: result.reason }, provider);
      }
      return acc;
    }, {});

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

function processPaqueteExpressQuoteResult(result, inputData) {
  if (result.status === 'fulfilled') {
    return {
      success: true,
      data: result.value // Ahora esto ya debería tener la estructura correcta { paqueterias: [...] }
    };
  } else {
    console.error('Error en cotización de Paquete Express:', result.reason);
    return {
      success: false,
      error: 'No se pudo obtener cotización de Paquete Express',
      details: result.reason.message
    };
  }
}

exports.generateGuide = async (req, res) => {
  try {
    const { provider, ...shipmentData } = req.body;
    
    if (!provider) {
      return res.status(400).json({ error: 'Se requiere especificar el proveedor' });
    }

    const strategy = strategies[provider.toLowerCase()];
    if (!strategy) {
      return res.status(400).json({ error: 'Proveedor no soportado' });
    }

    const guideResponse = await strategy.generateGuide(shipmentData);
    const standardizedResponse = standardizeGuideResponse(provider.toLowerCase(), guideResponse);

    // Manejo especial para Paquete Express
    if (provider.toLowerCase() === 'paqueteexpress' && guideResponse.pdfBuffer) {
      const labelPath = path.join(__dirname, '..', 'public', 'labels', `${standardizedResponse.data.guideNumber}.pdf`);
      await fs.writeFile(labelPath, guideResponse.pdfBuffer);
      standardizedResponse.data.guideUrl = `${LABEL_URL_BASE}/${standardizedResponse.data.guideNumber}.pdf`;
    }

    res.json(standardizedResponse);
  } catch (error) {
    console.error('Error en shippingController.generateGuide:', error);
    res.status(500).json({ 
      error: 'Error al generar la guía', 
      details: error.message 
    });
  }
};

function standardizeGuideResponse(provider, originalResponse) {
  const standardResponse = {
    success: true,
    message: "Guía generada exitosamente",
    data: {
      provider: provider,
      guideNumber: "",
      guideUrl: "",
      trackingUrl: "",
      labelType: "PDF",
      additionalInfo: {}
    }
  };

  switch (provider) {
    case 'superenvios':
      return standardizeSuperEnviosResponse(originalResponse, standardResponse);
    case 'fedex':
      return standardizeFedExResponse(originalResponse, standardResponse);
    case 'paqueteexpress':
      return standardizePaqueteExpressResponse(originalResponse, standardResponse);
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}

function standardizeSuperEnviosResponse(originalResponse, standardResponse) {
  if (originalResponse.respuesta && originalResponse.respuesta.pedido) {
    standardResponse.data.guideNumber = originalResponse.respuesta.pedido.numero_guia;
    standardResponse.data.guideUrl = originalResponse.respuesta.etiqueta;
    standardResponse.data.trackingUrl = `https://superenvios.mx/rastreo/${originalResponse.respuesta.pedido.numero_guia}`;
    standardResponse.data.additionalInfo = {
      idPedido: originalResponse.respuesta.pedido.idPedido,
      subtotal: originalResponse.respuesta.pedido.subtotal,
      total: originalResponse.respuesta.pedido.total,
      zona: originalResponse.respuesta.pedido.Zona
    };
    standardResponse.success = true;
    standardResponse.message = "Guía generada exitosamente con SuperEnvíos";
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con SuperEnvíos";
  }
  return standardResponse;
}

function standardizeFedExResponse(originalResponse, standardResponse) {
  if (originalResponse.trackingNumber) {
    standardResponse.data.guideNumber = originalResponse.trackingNumber;
    standardResponse.data.trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${originalResponse.trackingNumber}`;
    standardResponse.data.guideUrl = `${LABEL_URL_BASE}/${originalResponse.trackingNumber}.pdf`;
    standardResponse.data.additionalInfo = {
      serviceType: originalResponse.serviceType,
      serviceName: originalResponse.serviceName,
      shipDate: originalResponse.shipDate,
      cost: originalResponse.cost
    };
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con FedEx";
  }
  return standardResponse;
}

function standardizePaqueteExpressResponse(originalResponse, standardResponse) {
  if (originalResponse.success && originalResponse.data.guideNumber) {
    standardResponse.data.guideNumber = originalResponse.data.guideNumber;
    standardResponse.data.trackingUrl = originalResponse.data.trackingUrl;
    standardResponse.data.guideUrl = originalResponse.data.guideUrl || `${LABEL_URL_BASE}/${originalResponse.data.guideNumber}.pdf`;
    standardResponse.data.additionalInfo = originalResponse.data.additionalInfo;
    standardResponse.success = true;
    standardResponse.message = originalResponse.message;
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con Paquete Express";
  }
  return standardResponse;
}

module.exports = {
  getQuote: exports.getQuote,
  generateGuide: exports.generateGuide
};