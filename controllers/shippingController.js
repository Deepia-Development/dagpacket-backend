const { strategies } = require("../utils/shippingStrategy");
const ShipmentService = require("../services/ShipmentService");
const axios = require("axios");
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

    // console.log("searchTrackingNo", searchTrackingNo);

    provider = searchTrackingNo.data.provider;
    guideNumber = searchTrackingNo.data.guide_number;
    date = searchTrackingNo.data.updatedAt;

    if (searchTrackingNo.data.provider === "Paquete Express") {
      provider = "paqueteexpress";
    }
    es;

    // console.log("Rastreando guía:", provider, guideNumber, date);

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
    // console.log("Respuesta de rastreo:", trackingResponse);
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
    console.log("Cuerpo de la solicitud de cotización:", req.body);
    
    const isInternational = req.body.isInternational;
    
    // Construir quoteData con fallbacks para campos inconsistentes
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
      isInternational: isInternational,
      tipo_paquete: req.body.shippingType,
      package_type: req.body.package_type,
      
      // Datos de origen - con fallbacks
      estado_origen: req.body.estadoOrigen,
      ciudad_origen: req.body.ciudadOrigen,
      colonia_origen: req.body.coloniaOrigen || req.body.coloniaRemitente,
      isoEstadoOrigen: req.body.isoEstadoOrigen,
      
      // Datos de destino - con fallbacks
      estado_destino: req.body.estadoDestino,
      ciudad_destino: req.body.ciudad_destino || req.body.ciudadDestino,
      colonia_destino: req.body.colonia_destino || req.body.coloniaDestinatario,
      recipient_state_iso: req.body.recipient_state_iso,
      
      // Datos adicionales
      carta_porte: req.body.carta_porte,
      products: req.body.products,
      purpose: req.body.purpose,
    };

    console.log(
      `Cotización ${isInternational ? 'INTERNACIONAL' : 'NACIONAL'}:`,
      quoteData
    );

    // Obtener cotizaciones de todas las paqueterías
    const quotePromises = Object.entries(strategies).map(
      ([provider, strategy]) =>
        strategy.getQuote(quoteData)
          .then((result) => [provider, result])
          .catch((error) => {
            console.error(`Error en estrategia ${provider}:`, error);
            throw { provider, error: error.message };
          })
    );

    const quoteResults = await Promise.allSettled(quotePromises);

    // Procesar resultados
    const response = quoteResults.reduce((acc, result) => {
      if (result.status === "fulfilled") {
        const [provider, quoteResult] = result.value;
        let processedResult;

        // Procesar según el proveedor
        switch (provider) {
          case "fedex":
            processedResult = processFedExQuoteResult(quoteResult);
            break;
          case "paqueteexpress":
            processedResult = processPaqueteExpressQuoteResult(
              { status: "fulfilled", value: quoteResult },
              quoteData
            );
            break;
          case "dhl":
            processedResult = processDHLQuoteResult(
              { status: "fulfilled", value: quoteResult },
              quoteData
            );
            break;
          case "ups":
            processedResult = processQuoteResult(
              { status: "fulfilled", value: quoteResult },
              quoteData
            );
            break;
          default:
            processedResult = processQuoteResult(
              { status: "fulfilled", value: quoteResult },
              provider
            );
        }

        if (processedResult.success) {
          // Agregar metadata a cada cotización
          acc[provider] = {
            ...processedResult,
            timestamp: new Date().toISOString(),
            provider: provider,
            shippingType: isInternational ? 'internacional' : 'nacional',
          };
        } else {
          console.warn(
            `Cotización fallida para ${provider}:`,
            processedResult.error
          );
        }
      } else {
        const provider = result.reason?.provider || "Unknown";
        console.error(`Error en cotización de ${provider}:`, result.reason);
      }
      return acc;
    }, {});

    // Verificar si hay cotizaciones exitosas
    if (Object.keys(response).length === 0) {
      return res.status(404).json({
        error: "No se encontraron cotizaciones disponibles",
        details:
          "Ninguna paquetería pudo proporcionar una cotización para los parámetros dados",
      });
    }

    // Retornar directamente el objeto con las paqueterías
    // NO envolver en { response: {...} } ni { success: true, quotes: {...} }
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
    console.log("Datos de envío para generar guía:", JSON.stringify(shipmentData, null, 2));

    if (!provider) {
      return res.status(400).json({ error: "Se requiere especificar el proveedor" });
    }

    const strategy = strategies[provider.toLowerCase()];
    if (!strategy) {
      return res.status(400).json({ error: "Proveedor no soportado" });
    }

    const guideResponse = await strategy.generateGuide(shipmentData);
    const standardizedResponse = await standardizeGuideResponse(provider.toLowerCase(), guideResponse);

    console.log("Respuesta estandarizada:", standardizedResponse);

    if (!standardizedResponse.success) {
      return res.status(500).json({
        error: "Error al generar la guía",
        details: standardizedResponse.message
      });
    }

    const { guideNumber, pdfBuffer, imageBuffer } = standardizedResponse.data;

    if (guideNumber && (pdfBuffer || imageBuffer)) {
      try {
        const labelsDir = path.join(__dirname, "..", "public", "labels");
        await fs.mkdir(labelsDir, { recursive: true });

        let filename;
        let filePath;

        if (pdfBuffer) {
          filename = `${guideNumber}.pdf`;
          filePath = path.join(labelsDir, filename);
          await fs.writeFile(filePath, pdfBuffer);
          standardizedResponse.data.labelType = "PDF";
        } 
        else if (imageBuffer) {
          filename = `${guideNumber}.png`;
          filePath = path.join(labelsDir, filename);
          await fs.writeFile(filePath, imageBuffer);
          standardizedResponse.data.labelType = "IMAGE";
        }

        standardizedResponse.data.guideUrl = `${LABEL_URL_BASE}/${filename}`;

        delete standardizedResponse.data.pdfBuffer;
        delete standardizedResponse.data.imageBuffer;

        console.log("Etiqueta guardada en:", filePath);
      } catch (err) {
        console.error("Error al guardar etiqueta:", err);
      }
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


async function standardizeGuideResponse(provider, originalResponse) {
  // console.log("Provider:", provider);
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
    case "t1envios":
      return standardizeT1EnviosResponse(originalResponse, standardResponse);
    case "turboenvios":
      return standardizeTurboEnviosResposne(originalResponse, standardResponse);
    case "soloenvios":
      return await standardizeSoloEnviosResponse(
        originalResponse,
        standardResponse
      );
      case "mailbox":
      return await standardizeMailBoxResponse(originalResponse, standardResponse);
      case "mailbox_international":
      return await standardizeMailBoxResponse(originalResponse, standardResponse);
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

function standardizeT1EnviosResponse(originalResponse, standardResponse) {
  if (originalResponse.success && originalResponse.detail.guia) {
    standardResponse.success = true;

    standardResponse.message =
      originalResponse.message || "Guía generada exitosamente con T1 Envíos";
    standardResponse.data = {
      guideNumber: originalResponse.detail.guia,
      guideUrl: originalResponse.detail.link_guia,
      pdfBuffer: null, // Si no se incluye en la respuesta, se puede dejar como null
      additionalInfo: {
        packages: originalResponse.detail.paquetes,
        shipmentTrackingNumber: originalResponse.detail.num_orden,
        carrier: originalResponse.detail.paqueteria,
        createdAt: originalResponse.detail.fecha_creacion,
        cost: originalResponse.detail.costo,
        destination: originalResponse.detail.destino,
        balance: originalResponse.detail.saldo_actual || "",
      },
    };
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con T1 Envíos";
    standardResponse.data = {};
  }

  return standardResponse;
}

function standardizeTurboEnviosResposne(originalResponse, standardResponse) {
  // console.log("Respuesta de TurboEnvios:", originalResponse);
  if (originalResponse.success && originalResponse.data.trackingNumber) {
    standardResponse.success = true;
    standardResponse.message =
      originalResponse.message || "Guía generada exitosamente con TurboEnvios";
    standardResponse.data = {
      guideNumber: originalResponse.data.trackingNumber,
      guideUrl: originalResponse.data.labelUrl,
      pdfBuffer: null, // Si no se incluye en la respuesta, se puede dejar como null
    };
  }

  return standardResponse;
}

async function standardizeMailBoxResponse(originalResponse, standardResponse) {
  if (!originalResponse || !originalResponse.tracking) {
    standardResponse.success = false;
    standardResponse.message = "Error al generar la guía con MailBox";
    return standardResponse;
  }

  const tracking = originalResponse.tracking;
  const labelB64 = originalResponse.label;
  const widgetUrl = originalResponse.widget_url;

  standardResponse.data.guideNumber = tracking;
  standardResponse.data.trackingUrl =
    widgetUrl ||
    `https://www.fedex.com/apps/fedextrack/?tracknumbers=${tracking}`;
  standardResponse.data.additionalInfo = {
    courier: originalResponse.courier,
    status: originalResponse.status,
    order_number: originalResponse.order_number,
  };

  if (labelB64) {
    try {
      let labelType = "UNKNOWN";
      let base64Content = labelB64;

      // Si tiene encabezado tipo data:
      if (labelB64.startsWith("data:")) {
        if (labelB64.includes("application/pdf")) labelType = "PDF";
        else if (labelB64.includes("image/")) labelType = "IMAGE";
        base64Content = labelB64.split(",")[1];
      }

      const buffer = Buffer.from(base64Content, "base64");

      // Detectar por firma binaria si no se supo aún
      if (labelType === "UNKNOWN") {
        const signature = buffer.toString("hex", 0, 4);
        if (signature === "25504446") labelType = "PDF"; // %PDF
        else if (signature.startsWith("89504e47")) labelType = "IMAGE"; // PNG
        else if (signature.startsWith("ffd8ff")) labelType = "IMAGE"; // JPG
      }

      // Guardar en el campo correcto
      if (labelType === "PDF") {
        standardResponse.data.pdfBuffer = buffer;
      } else if (labelType === "IMAGE") {
        standardResponse.data.imageBuffer = buffer;
      }

      standardResponse.data.labelType = labelType;
    } catch (err) {
      console.error("Error detectando tipo de etiqueta MailBox:", err);
    }
  }

  standardResponse.success = true;
  standardResponse.message = "Guía generada exitosamente con MailBox";
  return standardResponse;
}




async function standardizeSoloEnviosResponse(
  originalResponse,
  standardResponse
) {
  // console.log("Respuesta de SoloEnvios:", originalResponse);

  const attributes = originalResponse?.data?.attributes;
  const packageInfo = originalResponse?.included?.find(
    (item) => item.type === "package"
  );

  if (originalResponse?.data?.id) {
    if (attributes?.workflow_status === "success") {
      let pdfBuffer = null;

      // Descargar el PDF si hay URL disponible
      if (packageInfo?.attributes?.label_url) {
        try {
          // console.log(
          //   "Descargando PDF desde:",
          //   packageInfo.attributes.label_url
          // );

          const pdfResponse = await axios.get(
            packageInfo.attributes.label_url,
            {
              responseType: "arraybuffer",
            }
          );

          pdfBuffer = Buffer.from(pdfResponse.data);
          // console.log(
          //   "PDF descargado exitosamente, tamaño:",
          //   pdfBuffer.length,
          //   "bytes"
          // );
        } catch (pdfError) {
          console.error("Error al descargar el PDF:", pdfError.message);
          // No lanzamos error, solo logueamos y continuamos sin el PDF
        }
      }

      standardResponse.success = true;
      standardResponse.message = "Envío creado exitosamente con SoloEnvios.";
      standardResponse.data = {
        guideNumber: packageInfo?.attributes?.tracking_number || null,
        guideUrl: packageInfo?.attributes?.label_url || null,
        pdfBuffer: pdfBuffer,
      };
    } else {
      standardResponse.success = true;
      standardResponse.message =
        "Envío creado exitosamente con SoloEnvios, pero la guía aún no está disponible.";
      standardResponse.data = {
        guideNumber: null,
        guideUrl: null,
        pdfBuffer: null,
      };
    }
  } else {
    standardResponse.success = false;
    standardResponse.message = "Error al crear el envío con SoloEnvios.";
    standardResponse.data = null;
  }

  return standardResponse;
}

module.exports = {
  getQuote: exports.getQuote,
  generateGuide: exports.generateGuide,
  trackGuide: exports.trackGuide,
};
