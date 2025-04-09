const { strategies } = require("../utils/shippingStrategy");
const ShipmentService = require("../services/ShipmentService");
const { mapFedExResponse } = require("../utils/fedexResponseMapper");
const { mapPaqueteExpressResponse } = require("../utils/paqueteExpressMapper");
const config = require("../config/config");
const path = require("path");
const fs = require("fs").promises;

const LABEL_URL_BASE = `${config.backendUrl}/labels`;

exports.trackGuide = async (req, res) => {
  try {
    let provider, guideNumber, date;
    const searchTrackingNo = await ShipmentService.getShipmentByTracking(req);

    console.log("searchTrackingNo", searchTrackingNo);

    provider = searchTrackingNo.data.provider;
    guideNumber = searchTrackingNo.data.guide_number;
    date = searchTrackingNo.data.updatedAt;

    if (searchTrackingNo.data.provider === "Paquete Express") {
      provider = "paqueteexpress";
    }

    console.log("Rastreando guía:", provider, guideNumber, date);

    if (!provider) {
      return res
        .status(400)
        .json({ error: "Se requiere especificar el proveedor" });
    }

    const strategy = strategies[provider.toLowerCase()];

    if (!strategy) {
      return res.status(400).json({ error: "Proveedor no soportado" });
    }

    const trackingResponse = await strategy.trackGuide(guideNumber, date);
    console.log("Respuesta de rastreo:", trackingResponse);
    if (
      trackingResponse &&
      (trackingResponse.result?.success || trackingResponse.success)
    ) {
      res.json(trackingResponse);
    } else {
      res.status(404).json(trackingResponse);
    }
  } catch (error) {
    console.error("Error en shippingController.trackGuide:", error);
    res.status(500).json({
      error: "Error al rastrear la guía",
      details: error.message,
    });
  }
};

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
      valor_declarado: req.body.valor_declarado,
      tipo_paquete: req.body.shippingType,
    };

    const quotePromises = Object.entries(strategies).map(
      ([provider, strategy]) =>
        strategy.getQuote(quoteData)
          .then((result) => {
            return [provider, result];
          })
    );
    
    

    console.log("Promesas de cotización:", quotePromises);

    const quoteResults = await Promise.allSettled(quotePromises);

    console.log("Resultados de cotización:", quoteResults);

    const response = quoteResults.reduce((acc, result) => {
      console.log("Result:", result);
      if (result.status === "fulfilled") {
        const [provider, quoteResult] = result.value;
        let processedResult;

        if (provider === "fedex") {
          processedResult = processFedExQuoteResult(quoteResult);
        } else if (provider === "paqueteexpress") {
          processedResult = processPaqueteExpressQuoteResult(
            { status: "fulfilled", value: quoteResult },
            quoteData
          );
        } else if (provider === "dhl") {
          processedResult = processDHLQuoteResult(
            { status: "fulfilled", value: quoteResult },
            quoteData
          );
        } else if (provider === "ups") {
          processedResult = processQuoteResult(
            { status: "fulfilled", value: quoteResult },
            quoteData
          );
        } else {
          processedResult = processQuoteResult(
            { status: "fulfilled", value: quoteResult },
            provider
          );
        }

        // Solo incluimos en la respuesta si el resultado fue exitoso
        if (processedResult.success) {
          acc[provider] = processedResult;
        } else {
          console.warn(
            `Cotización fallida para ${provider}:`,
            processedResult.error
          );
        }
      } else {
        const provider = result.reason.provider || "Unknown";
        console.error(`Error en cotización de ${provider}:`, result.reason);
      }
      return acc;
    }, {});

    // Verificamos si hay al menos una cotización exitosa
    if (Object.keys(response).length === 0) {
      return res.status(404).json({
        error: "No se encontraron cotizaciones disponibles",
        details:
          "Ninguna paquetería pudo proporcionar una cotización para los parámetros dados",
      });
    }

    res.json(response);
  } catch (error) {
    console.error("Error en shippingController.getQuote:", error);
    res.status(500).json({
      error: "Error al obtener las cotizaciones",
      details: error.message,
    });
  }
};

function processFedExQuoteResult(quoteResult) {
  if (
    quoteResult &&
    quoteResult.paqueterias &&
    Array.isArray(quoteResult.paqueterias)
  ) {
    return {
      success: true,
      data: quoteResult,
    };
  } else {
    console.error(
      "Estructura de respuesta de FedEx inesperada:",
      JSON.stringify(quoteResult, null, 2)
    );
    return {
      success: false,
      error: "Estructura de respuesta de FedEx inesperada",
      details: "La respuesta no contiene la estructura esperada",
    };
  }
}

function processQuoteResult(result, providerName) {
  console.log("Procesando cotización de", providerName);  
  if (result.status === "fulfilled") {
    return {
      success: true,
      data: result.value,
    };
  } else {
    console.error(`Error en cotización de ${providerName}:`, result.reason);
    return {
      success: false,
      error: `No se pudo obtener cotización de ${providerName}`,
      details: result.reason.message,
    };
  }
}

function processPaqueteExpressQuoteResult(result, inputData) {
  if (result.status === "fulfilled") {
    return {
      success: true,
      data: result.value,
    };
  } else {
    console.error("Error en cotización de Paquete Express:", result.reason);
    return {
      success: false,
      error: "No se pudo obtener cotización de Paquete Express",
      details: result.reason.message,
    };
  }
}

function processDHLQuoteResult(result, inputData) {
  if (result.status === "fulfilled") {
    if (
      result.value &&
      result.value.paqueterias &&
      Array.isArray(result.value.paqueterias)
    ) {
      // Verificamos si hay cotizaciones disponibles
      if (result.value.paqueterias.length > 0) {
        return {
          success: true,
          data: result.value,
        };
      } else {
        console.warn(
          "DHL no devolvió cotizaciones:",
          JSON.stringify(result.value, null, 2)
        );
        return {
          success: false,
          error: "No se encontraron cotizaciones de DHL",
          details:
            "DHL no devolvió cotizaciones para los parámetros proporcionados",
        };
      }
    } else {
      console.error(
        "Estructura de respuesta de DHL inesperada:",
        JSON.stringify(result.value, null, 2)
      );
      return {
        success: false,
        error: "Estructura de respuesta de DHL inesperada",
        details: "La respuesta no contiene la estructura esperada",
      };
    }
  } else {
    console.error("Error en cotización de DHL:", result.reason);
    return {
      success: false,
      error: "No se pudo obtener cotización de DHL",
      details: result.reason.message || "Error desconocido",
    };
  }
}

exports.generateGuide = async (req, res) => {
  try {
    const { provider, ...shipmentData } = req.body;
    console.log("Datos de envío para generar guía:", shipmentData);
    //console.log('Proveedor de envío:', provider);

    if (!provider) {
      return res
        .status(400)
        .json({ error: "Se requiere especificar el proveedor" });
    }

    const strategy = strategies[provider.toLowerCase()];

    if (!strategy) {
      return res.status(400).json({ error: "Proveedor no soportado" });
    }

    const guideResponse = await strategy.generateGuide(shipmentData);
    const standardizedResponse = standardizeGuideResponse(
      provider.toLowerCase(),
      guideResponse
    );

    console.log("Respuesta de generación de guía:", standardizedResponse);

    // Manejo especial para guardar la etiqueta
    if (standardizedResponse.success && standardizedResponse.data.pdfBuffer) {
      const labelPath = path.join(
        __dirname,
        "..",
        "public",
        "labels",
        `${standardizedResponse.data.guideNumber}.pdf`
      );

      const directoryPath = path.dirname(labelPath);
      try {
        await fs.mkdir(directoryPath, { recursive: true }); // Crea el directorio si no existe
      } catch (err) {
        console.error("Error al crear directorio:", err);
        return res.status(500).json({
          error: "Error al crear directorio para la etiqueta",
          details: err.message,
        });
      }

      await fs.writeFile(labelPath, standardizedResponse.data.pdfBuffer);
      standardizedResponse.data.guideUrl = `${LABEL_URL_BASE}/${standardizedResponse.data.guideNumber}.pdf`;
      delete standardizedResponse.data.pdfBuffer; // Eliminamos el buffer de la respuesta
    }

    res.json(standardizedResponse);
  } catch (error) {
    console.error("Error en shippingController.generateGuide:", error);
    res.status(500).json({
      error: "Error al generar la guía",
      details: error.message,
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
      additionalInfo: {},
      pdfBuffer: null,
    },
  };

  switch (provider) {
    case "superenvios":
      return standardizeSuperEnviosResponse(originalResponse, standardResponse);
    case "fedex":
      return standardizeFedExResponse(originalResponse, standardResponse);
    case "paqueteexpress":
      return standardizePaqueteExpressResponse(
        originalResponse,
        standardResponse
      );
    case "dhl":
      return standardizeDHLResponse(originalResponse, standardResponse);
    case "estafeta":
      return standardizeEstafetaResponse(originalResponse, standardResponse);
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}

function standardizeSuperEnviosResponse(originalResponse, standardResponse) {
  if (originalResponse.respuesta && originalResponse.respuesta.pedido) {
    standardResponse.data.guideNumber =
      originalResponse.respuesta.pedido.numero_guia;
    standardResponse.data.guideUrl = originalResponse.respuesta.etiqueta;
    standardResponse.data.trackingUrl = `https://superenvios.mx/rastreo/${originalResponse.respuesta.pedido.numero_guia}`;
    standardResponse.data.additionalInfo = {
      idPedido: originalResponse.respuesta.pedido.idPedido,
      subtotal: originalResponse.respuesta.pedido.subtotal,
      total: originalResponse.respuesta.pedido.total,
      zona: originalResponse.respuesta.pedido.Zona,
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
      cost: originalResponse.cost,
    };
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con FedEx";
  }
  return standardResponse;
}

function standardizePaqueteExpressResponse(originalResponse, standardResponse) {
 // console.log("Respuesta de Paquete Express:", originalResponse);
  if (originalResponse.success && originalResponse.data.guideNumber) {
    standardResponse.data.guideNumber = originalResponse.data.guideNumber;
    standardResponse.data.trackingUrl = originalResponse.data.trackingUrl;
    standardResponse.data.pdfBuffer = originalResponse.pdfBuffer;
    standardResponse.data.guideUrl =
      originalResponse.data.guideUrl ||
      `${LABEL_URL_BASE}/${originalResponse.data.guideNumber}.pdf`;
    standardResponse.data.additionalInfo = originalResponse.data.additionalInfo;
    standardResponse.success = true;
    standardResponse.message = originalResponse.message;
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con Paquete Express";
  }
  return standardResponse;
}

function standardizeDHLResponse(originalResponse, standardResponse) {
  if (originalResponse.success && originalResponse.data.guideNumber) {
    standardResponse.data.guideNumber = originalResponse.data.guideNumber;
    standardResponse.data.trackingUrl = originalResponse.data.trackingUrl;
    standardResponse.data.pdfBuffer = originalResponse.data.pdfBuffer;
    standardResponse.data.additionalInfo = {
      packages: originalResponse.data.additionalInfo.packages,
      shipmentTrackingNumber:
        originalResponse.data.additionalInfo.shipmentTrackingNumber,
    };
    standardResponse.success = true;
    standardResponse.message = "Guía generada exitosamente con DHL";
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con DHL";
  }
  return standardResponse;
}

function standardizeEstafetaResponse(originalResponse, standardResponse) {
  if (originalResponse.success && originalResponse.data.guideNumber) {
    standardResponse.data.guideNumber = originalResponse.data.guideNumber;
    standardResponse.data.trackingUrl = originalResponse.data.trackingUrl;
    standardResponse.data.pdfBuffer = originalResponse.data.pdfBuffer;
    standardResponse.data.additionalInfo = {
      packages: originalResponse.data.additionalInfo.packages,
      shipmentTrackingNumber:
        originalResponse.data.additionalInfo.shipmentTrackingNumber,
    };
    standardResponse.success = true;
    standardResponse.message = "Guía generada exitosamente con Estafeta";
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con Estafeta";
  }
  return standardResponse;
}

module.exports = {
  getQuote: exports.getQuote,
  generateGuide: exports.generateGuide,
  trackGuide: exports.trackGuide,
};
