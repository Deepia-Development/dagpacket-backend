const ShipmentService = require("../services/ShipmentService");
class ShippingStrategy {
  async generateGuide(shipmentData) {
    throw new Error("generateGuide method must be implemented");
  }

  async getQuote(quoteData) {
    throw new Error("getQuote method must be implemented");
  }

  async trackGuide(trackingNumber) {
    throw new Error("trackGuide method must be implemented");
  }
}

const FedexService = require("../services/fedexService");
const SuperEnviosService = require("../services/superEnviosService");
const PaqueteExpressService = require("../services/paqueteExpressService");
const DHLService = require("../services/dhlService");
const EstafetaService = require("../services/estafetaService");
const UpsService = require("../services/UpsService");
const T1EnviosService = require("../services/T1EnviosService");
const SoloEnviosService = require("../services/soloEnviosService");
const TurboEnviosService = require("../services/TurboEnviosService");
class FedexStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    return await FedexService.createShipment(shipmentData);
  }

  async getQuote(quoteData) {
    return await FedexService.getQuote(quoteData);
  }

  async trackGuide(trackingNumber) {
    return await FedexService.trackGuide(trackingNumber);
  }
}

class SoloEnviosStrategy extends ShippingStrategy {
  async getQuote(quoteData) {
    return await SoloEnviosService.getQuote(quoteData);
  }

  async generateGuide(shipmentData) {
    return await SoloEnviosService.generateGuide(shipmentData);
  }

  async trackGuide(trackingNumber) {
    return await SoloEnviosService.trackGuide(trackingNumber);
  }
};

class T1EnviosStrategy extends ShippingStrategy {
  async getQuote(quoteData) {
    console.log("quoteData t1envios en shipping strategy", quoteData);
    return await T1EnviosService.getQuote(quoteData);
  }

  async generateGuide(shipmentData) {
    return await T1EnviosService.generateGuide(shipmentData);
  }
};


class TurboEnviosStrategy extends ShippingStrategy {
  async getQuote(quoteData) {
    return await TurboEnviosService.getQuote(quoteData);
  }
  async generateGuide(shipmentData) {
    return await TurboEnviosService.generateGuide(shipmentData);
  }
};




class SuperEnviosStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    return await SuperEnviosService.generateGuide(shipmentData);
  }

  async getQuote(quoteData) {
    return await SuperEnviosService.getQuote(quoteData);
  }
}

class EstafetaStrategy extends ShippingStrategy {
  async getQuote(quoteData) {
    console.log("quoteData estafeta en shipping strategy", quoteData);
    return await EstafetaService.getQuote(quoteData);
  }

  async trackGuide(trackingNumber) {
    return await EstafetaService.trackGuide(trackingNumber);
  }

  async generateGuide(shipmentData) {
    try {
      const response = await EstafetaService.createShipment(shipmentData);

      // Check if the shipment was successful
      if (response.labelPetitionResult.elementsCount > 0) {
        console.log(
          "Full Estafeta response:",
          JSON.stringify(response, null, 2)
        );
        const labelContent = response.data;
        if (!labelContent) {
          throw new Error(
            "No se encontró el contenido de la etiqueta en la respuesta de Estafeta"
          );
        }

        return {
          success: true,
          message: "Guía generada exitosamente con Estafeta",
          data: {
            guideNumber: response.labelPetitionResult.elements[0].wayBill, // Guide number
            trackingUrl: response.labelPetitionResult.elements[0].trackingCode, // Estafeta response doesn't seem to provide a tracking URL
            labelUrl: null,
            additionalInfo: {
              destinationAddress:
                response.labelPetitionResult.destinationAddress,
              generatorSystem: response.generatorSystems.name,
              generatorSystemVersion: response.generatorSystems.version,
            },
            // Attempt to extract PDF content safely
            pdfBuffer: Buffer.from(labelContent, "base64"), // Temporarily set to null
          },
        };
      } else {
        throw new Error(
          "Error al generar guía con Estafeta: No se generaron elementos de etiqueta"
        );
      }
    } catch (error) {
      console.error("Error al generar guía con Estafeta:", error);
      throw new Error("Error al generar guía con Estafeta: " + error.message);
    }
  }
}



class PaqueteExpressStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    try {
      const createShipmentResponse = await PaqueteExpressService.createShipment(
        shipmentData
      );
      const guideBuffer = await PaqueteExpressService.generateGuide(
        createShipmentResponse.data
      );

      console.log("Paquete Express guide response:", guideBuffer);
      
      const {
        mapPaqueteExpressGuideResponse,
      } = require("../utils/paqueteExpressMapper");
      return mapPaqueteExpressGuideResponse(
        createShipmentResponse,
        guideBuffer
      );
    } catch (error) {
      console.error("Error al generar guía con Paquete Express:", error);
      throw new Error(
        "Error al generar guía con Paquete Express: " + error.message
      );
    }
  }

  async trackGuide(trackingNumber) {
    return await PaqueteExpressService.trackGuide(trackingNumber);
  }

  async getQuote(quoteData) {
    return await PaqueteExpressService.getQuote(quoteData);
  }
}

class DHLStrategy extends ShippingStrategy {
  async generateGuide(shipmentData) {
    try {
      const response = await DHLService.createShipment(shipmentData);

      if (!response.success || !response.data.guideNumber) {
        throw new Error(
          "Error al generar guía con DHL: " +
            (response.message || "Respuesta inesperada")
        );
      }

      const labelContent = response.data.documents.find(
        (doc) => doc.typeCode === "label"
      )?.content;
      if (!labelContent) {
        throw new Error(
          "No se encontró el contenido de la etiqueta en la respuesta de DHL"
        );
      }

      return {
        success: true,
        message: "Guía generada exitosamente con DHL",
        data: {
          guideNumber: response.data.guideNumber,
          trackingUrl: response.data.trackingUrl,
          labelUrl: null, // DHL proporciona el contenido de la etiqueta directamente
          additionalInfo: {
            packages: response.data.packages,
            shipmentTrackingNumber: response.data.shipmentTrackingNumber,
          },
          pdfBuffer: Buffer.from(labelContent, "base64"), // Convertimos el contenido base64 a un buffer
        },
      };
    } catch (error) {
      console.error("Error al generar guía con DHL:", error);
      throw new Error("Error al generar guía con DHL: " + error.message);
    }
  }

  async getQuote(quoteData) {
    return await DHLService.getQuote(quoteData);
  }

  async trackGuide(trackingNumber,date) {
    return await DHLService.trackGuide(trackingNumber,date);
  }
}

class UpsStrategy extends ShippingStrategy {
  async getQuote(quoteData) {
    return await UpsService.getQuote(quoteData);
  }
  

  async generateGuide(shipmentData) {
    try{

      const response = await UpsService.createShipment(shipmentData);
     // console.log("Response UPS",response);
      if(response.statusCode != 200){
        throw new Error("Error al generar guía con UPS: " + response.message);
      }

     // console.log("UPS response:", response.data);

      return {
        success: true,
        message: "Guía generada exitosamente con UPS",
        data: {
          guideNumber: response.data.guideNumber,
          trackingUrl: response.data.trackingUrl,
          labelUrl: response.data.labelUrl,
          additionalInfo: {
            packages: response.data.packages,
            shipmentTrackingNumber: response.data.shipmentTrackingNumber,
          },
          pdfBuffer: Buffer.from(response.data.labelContent, "base64"), // Convertimos el contenido base64 a un buffer
        },
      };
    }catch(error){
      console.error("Error al generar guía con UPS:", error);
      throw new Error("Error al generar guía con UPS: " + error.message);
    }
  }
}


const strategies = {
  // fedex: new FedexStrategy(),
  // superenvios: new SuperEnviosStrategy(),
  // paqueteexpress: new PaqueteExpressStrategy(),
  // dhl: new DHLStrategy(),
  // estafeta: new EstafetaStrategy(),
  // ups: new UpsStrategy(),
  // t1envios: new T1EnviosStrategy(),
  // turboenvios: new TurboEnviosStrategy(),
    soloenvios: new SoloEnviosStrategy(),

};

module.exports = {
  strategies,
  ShippingStrategy,
};
