const axios = require("axios");
const config = require("../config/config");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs-extra");
const path = require("path");
const Service = require("../models/ServicesModel");
const { mapFedExResponse,mapFedExResponseTracking } = require("../utils/fedexResponseMapper");
const { getExchangeRate } = require("../services/exchangeServices");

class FedexService {
  constructor() {
    this.baseUrl = config.fedex.apiUrl;
    this.rateApiUrl = `${this.baseUrl}/rate/v1/rates/quotes`;
    this.shipApiUrl = `${this.baseUrl}/ship/v1/shipments`;
    this.trackUrl = `${this.baseUrl}/track/v1/trackingnumbers`;
    this.authUrl = `${this.baseUrl}/oauth/token`;
    this.accountNumber = config.fedex.accountNumber;
    this.clientId = config.fedex.clientId;
    this.clientSecret = config.fedex.apiSecret;
    this.clientIdTracking = config.fedex.clientIdTracking;
    this.clientSecretTracking = config.fedex.apiSecretTracking;
    this.accessTokenTracking = null;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async trackGuide(trackingNumber) {
    try {
      await this.ensureValidTokenTracking();

      const requestBody = this.buildRequestTracking(trackingNumber);
      console.log("Request body:", requestBody);
      console.log('URL:', this.trackUrl);
      const response = await axios.post(this.trackUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessTokenTracking}`,
        },
      });

      // console.log("Respuesta de FedEx Track API:", JSON.stringify(response.data.output, null, 2));
      // Aplicar el mapeo a la respuesta de FedExc
      let mappedResponse = mapFedExResponseTracking(response.data.output.completeTrackResults[0]);
      console.log("Mapped response:", mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error("Error en FedEx Track API:", error);
      throw new Error(
        "Error al obtener el tracking de FedEx: " + error.message
      );
    }
  }

  //Funcion con cambio de moneda, al parecer en produccion no es necesario
  // async getQuote(shipmentDetails) {
  //   try {
  //     await this.ensureValidToken();
  //     const requestBody = this.buildQuoteRequestBody(shipmentDetails);
  //     // console.log('Request body:', requestBody);
  //     const response = await axios.post(this.rateApiUrl, requestBody, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${this.accessToken}`
  //       }
  //     });

  //     // console.log('Respuesta de FedEx cruda:', response.data.output.rateReplyDetails);
  //     // Aplicar el mapeo a la respuesta de FedEx
  //     let mappedResponse = mapFedExResponse(response.data, shipmentDetails);

  //     // console.log('Mapped response:', mappedResponse);

  //     // Obtener el tipo de cambio
  //     let exchangeRate;
  //     try {
  //       exchangeRate = await getExchangeRate();
  //     } catch (error) {
  //       console.warn('Error al obtener el tipo de cambio. Usando valor por defecto:', error);
  //       exchangeRate = 20; // Valor por defecto en caso de error
  //     }

  //     // Convertir precios de USD a MXN
  //     mappedResponse = mappedResponse.map(quote => ({
  //       ...quote,
  //       precio: (parseFloat(quote.precio) * exchangeRate).toFixed(2),
  //       precio_api: (parseFloat(quote.precio) * exchangeRate).toFixed(2),
  //       precio_regular: (parseFloat(quote.precio_regular) * exchangeRate).toFixed(2)
  //     }));

  //     // Aplicar los porcentajes a los precios devueltos
  //     const quotesWithPercentages = await this.applyPercentagesToQuote(mappedResponse);
  //     // console.log('Cotizaciones de FedEx:', quotesWithPercentages);
  //     return {
  //       paqueterias: quotesWithPercentages
  //     };
  //   } catch (error) {
  //     console.error('Error en FedEx Quote API:', error);
  //     throw new Error('Error al obtener las cotizaciones de FedEx: ' + error.message);
  //   }
  // }

  // async applyPercentagesToQuote(quotes) {
  //   const fedexService = await Service.findOne({ name: 'Fedex' });
  //   if (!fedexService) {
  //     console.warn('No se encontraron porcentajes para FedEx');
  //     return quotes;
  //   }

  //   return quotes.map(quote => {
  //     const provider = fedexService.providers.find(p => p.name === 'Fedex');
  //     if (provider) {
  //       const service = provider.services.find(s => s.idServicio === quote.idServicio);
  //       if (service) {
  //         const percentage = service.percentage / 100 + 1;
  //         quote.precio_regular = quote.precio;
  //         quote.precio = (parseFloat(quote.precio) * percentage).toFixed(2);
  //       }
  //     }
  //     return quote;
  //   });
  // }

  async getQuote(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildQuoteRequestBody(shipmentDetails);
      // console.log('Request body:', requestBody);
      const response = await axios.post(this.rateApiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      // console.log('Respuesta de FedEx cruda:', response.data.output.rateReplyDetails);
      // Aplicar el mapeo a la respuesta de FedEx
      let mappedResponse = mapFedExResponse(response.data, shipmentDetails);

      // console.log('Mapped response:', mappedResponse);

      // Aplicar los porcentajes a los precios devueltos (sin conversión de moneda)
      const quotesWithPercentages = await this.applyPercentagesToQuote(
        mappedResponse
      );
      // console.log('Cotizaciones de FedEx:', quotesWithPercentages);

      return {
        paqueterias: quotesWithPercentages,
      };
    } catch (error) {
      console.error("Error en FedEx Quote API:", error);
      throw new Error(
        "Error al obtener las cotizaciones de FedEx: " + error.message
      );
    }
  }

  async applyPercentagesToQuote(quotes) {
    const fedexService = await Service.findOne({ name: "Fedex" });

    if (!fedexService) {
      console.warn("No se encontraron porcentajes para FedEx");
      return quotes;
    }

    return quotes.map((quote) => {
      // First, find the provider (in this case, there's only one Fedex provider)
      const provider = fedexService.providers[0];

      // Then find the service by idServicio
      const service = provider.services.find(
        (s) => s.idServicio === quote.idServicio
      );

      if (!service) {
        quote.status = false;
        return quote;
      }

      const precio_guia = quote.precio / 0.95;
      const precio_venta = precio_guia / (1 - service.percentage / 100);

      const utilidad = precio_venta - precio_guia;
      const utilidad_dagpacket = utilidad * 0.3;
      const precio_guia_lic = precio_guia + utilidad_dagpacket;

      quote.precio = precio_venta.toFixed(2);
      quote.precio_regular = precio_guia_lic.toFixed(2);

      return {
        ...quote,
        precio_guia: precio_guia.toFixed(2),
        status: service.status,
      };
    });
  }

  async createShipment(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildShipmentRequestBody(shipmentDetails);
      console.log("Request body:", requestBody);

      const response = await axios.post(this.shipApiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      console.log("Respuesta de FedEx Ship API:", response.data);
      // Procesar la respuesta
      return this.processShipmentResponse(response.data);
    } catch (error) {
      console.error(
        "Error en FedEx Ship API:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  async processShipmentResponse(responseData) {
    console.log("Respuesta de FedEx Ship API:", responseData);
    const shipment = responseData.output.transactionShipments[0];
    const labelData =
      shipment.pieceResponses[0].packageDocuments[0].encodedLabel;

    // Generar PDF y obtener el enlace
    const pdfLink = await this.generateLabelPDF(
      labelData,
      shipment.masterTrackingNumber
    );

    return {
      trackingNumber: shipment.masterTrackingNumber,
      serviceType: shipment.serviceType,
      serviceName: shipment.serviceName,
      shipDate: shipment.shipDatestamp,
      cost: shipment.pieceResponses[0].netRateAmount,
      labelLink: pdfLink,
    };
  }

  async generateLabelPDF(encodedLabel, trackingNumber) {
    // Convertir pulgadas a puntos (1 pulgada = 72 puntos en PDF)
    const widthInPoints = 4 * 72; // 4 pulgadas
    const heightInPoints = 6 * 72; // 6 pulgadas

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([widthInPoints, heightInPoints]);

    // Decodifica la etiqueta
    const imageBytes = Buffer.from(encodedLabel, "base64");

    // Embed la imagen en el PDF
    const image = await pdfDoc.embedPng(imageBytes);

    // Ajustar la imagen para que ocupe toda la página
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: widthInPoints,
      height: heightInPoints,
    });

    // Guarda el PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(
      __dirname,
      "..",
      "public",
      "labels",
      `${trackingNumber}.pdf`
    );
    await fs.outputFile(outputPath, pdfBytes);

    // Retorna el enlace relativo al PDF
    return `/labels/${trackingNumber}.pdf`;
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshToken();
    }
  }

  async ensureValidTokenTracking() {
    if (!this.accessTokenTracking || this.isTokenExpired()) {
      await this.refreshTokenTracking();
    }
  }


  async refreshTokenTracking() {
    try {
      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientIdTracking,
          client_secret: this.clientSecretTracking,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessTokenTracking = response.data.access_token;
      console.log("Token de FedEx renovado:", this.accessTokenTracking);
      this.tokenExpiration = Date.now() + response.data.expires_in * 1000;
    } catch (error) {
      console.error(
        "Error al obtener token de FedEx:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }


  

  async refreshToken() {
    try {
      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      console.log("Token de FedEx renovado:", this.accessToken);
      this.tokenExpiration = Date.now() + response.data.expires_in * 1000;
    } catch (error) {
      console.error(
        "Error al obtener token de FedEx:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  isTokenExpired() {
    return !this.tokenExpiration || Date.now() >= this.tokenExpiration;
  }

  buildRequestTracking(trackingNumber) {

    console.log("Tracking number:", trackingNumber);
    if (!trackingNumber) {
      throw new Error("Se requiere un número de guía para rastrear");
    }

    if (typeof trackingNumber !== "string") {
      throw new Error("El número de guía debe ser una cadena de texto");
    }
    

    return {
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber: trackingNumber,
          },
        },
      ],
      includeDetailedScans: true,
    };
  }

  buildQuoteRequestBody(shipmentDetails) {
    return {
      accountNumber: {
        value: this.accountNumber,
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: shipmentDetails.cp_origen,
            countryCode: shipmentDetails.pais_origen,
          },
        },
        recipient: {
          address: {
            postalCode: shipmentDetails.cp_destino,
            countryCode: shipmentDetails.pais_destino,
          },
        },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",

        rateRequestType: ["LIST", "ACCOUNT"],
        preferredCurrency: "NMP", // Aseguramos que siempre se use NMP (pesos mexicanos)
        requestedPackageLineItems: [
          {
            weight: {
              units: "KG",
              value: shipmentDetails.peso,
            },
            dimensions: {
              length: shipmentDetails.largo,
              width: shipmentDetails.ancho,
              height: shipmentDetails.alto,
              units: "CM",
            },
          },
        ],
      },
    };
  }

  buildShipmentRequestBody(shipmentDetails) {
    const shipDate = new Date();
    const shipDatestamp = shipDate.toISOString().split("T")[0];

    return {
      labelResponseOptions: "LABEL",
      requestedShipment: {
        shipper: this.buildPartyDetails(shipmentDetails.from),
        recipients: [this.buildPartyDetails(shipmentDetails.to)],
        shipDatestamp: shipDatestamp,
        serviceType: shipmentDetails.package.service_id,
        packagingType: "YOUR_PACKAGING",
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        blockInsightVisibility: false,
        shippingChargesPayment: {
          paymentType: "SENDER",
          payor: {
            responsibleParty: {
              accountNumber: {
                value: this.accountNumber,
              },
            },
          },
        },
        labelSpecification: {
          labelStockType: shipmentDetails.impresion.tipo_papel,
          imageType: "PNG",
        },
        requestedPackageLineItems: [this.buildPackageDetails(shipmentDetails)],
        shipmentSpecialServices:
          this.buildShipmentSpecialServices(shipmentDetails),
        customsClearanceDetail:
          this.buildCustomsClearanceDetail(shipmentDetails),
      },
      accountNumber: {
        value: this.accountNumber,
      },
    };
  }

  buildPartyDetails(party) {
    const streetLine = `${party.street} ${party.external_number}`.trim().replace(/\s+/g, ' ');
    
    const streetLines = streetLine.length > 35 
      ? [streetLine.substring(0, 35)] 
      : [streetLine];
  
    return {
      contact: {
        personName: party.name,
        phoneNumber: party.phone,
        companyName: party.name,
      },
      address: {
        streetLines: [
          ...streetLines,
          party.settlement,
        ].filter(Boolean),
        city: party.city,
        stateOrProvinceCode: party.iso_estado,
        postalCode: party.zip_code,
        countryCode: party.iso_pais,
        residential: false,
      },
    };
  }

  buildPackageDetails(shipmentDetails) {
    return {
      customerReferences: [
        {
          customerReferenceType: "CUSTOMER_REFERENCE",
          value: shipmentDetails.package.content || "N/A",
        },
      ],
      weight: {
        units: "KG",
        value: shipmentDetails.package.weight,
      },
      dimensions: {
        length: shipmentDetails.package.length,
        width: shipmentDetails.package.width,
        height: shipmentDetails.package.height,
        units: "CM",
      },
      declaredValue: {
        amount: shipmentDetails.package.declared_value,
        currency: "NMP",
      },
      itemDescriptionForClearance:
        shipmentDetails.package.detailed_content ||
        shipmentDetails.package.content,
    };
  }

  buildCustomsClearanceDetail(shipmentDetails) {
    if (shipmentDetails.from.iso_pais === shipmentDetails.to.iso_pais) {
      return null; // No se necesita para envíos domésticos
    }

    return {
      dutiesPayment: {
        paymentType: "SENDER",
      },
      commodities: shipmentDetails.items.map((item) => ({
        numberOfPieces: parseInt(item.cantidad_producto),
        description: item.descripcion_producto,
        countryOfManufacture: shipmentDetails.from.iso_pais,
        weight: {
          units: "KG",
          value: parseFloat(item.peso_producto),
        },
        quantity: parseInt(item.cantidad_producto),
        quantityUnits: item.clave_unidad,
        unitPrice: {
          amount: parseFloat(item.valor_producto),
          currency: "NMP",
        },
        customsValue: {
          amount:
            parseFloat(item.valor_producto) * parseInt(item.cantidad_producto),
          currency: "NMP",
        },
      })),
    };
  }

  buildShipmentSpecialServices(shipmentDetails) {
    return {
      specialServiceTypes: [],
    };
  }
}

module.exports = new FedexService();
