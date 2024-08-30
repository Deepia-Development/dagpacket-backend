const axios = require('axios');
const config = require('../config/config');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');
const Service = require('../models/ServicesModel')
const { mapFedExResponse } = require('../utils/fedexResponseMapper');
const { getExchangeRate } = require('../services/exchangeServices')

class FedexService {
  constructor() {
    this.baseUrl = config.fedex.apiUrl;
    this.rateApiUrl = `${this.baseUrl}/rate/v1/rates/quotes`;
    this.shipApiUrl = `${this.baseUrl}/ship/v1/shipments`;
    this.authUrl = `${this.baseUrl}/oauth/token`;
    this.accountNumber = config.fedex.accountNumber;
    this.clientId = config.fedex.clientId;
    this.clientSecret = config.fedex.apiSecret; 
    this.accessToken = null;
    this.tokenExpiration = null;
  }  

  

  async getQuote(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildQuoteRequestBody(shipmentDetails);      

      const response = await axios.post(this.rateApiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      // Aplicar el mapeo a la respuesta de FedEx
      let mappedResponse = mapFedExResponse(response.data, shipmentDetails);
      
      // Obtener el tipo de cambio
      let exchangeRate;
      try {
        exchangeRate = await getExchangeRate();
      } catch (error) {
        console.warn('Error al obtener el tipo de cambio. Usando valor por defecto:', error);
        exchangeRate = 20; // Valor por defecto en caso de error
      }

      // Convertir precios de USD a MXN
      mappedResponse = mappedResponse.map(quote => ({
        ...quote,
        precio: (parseFloat(quote.precio) * exchangeRate).toFixed(2),
        precio_regular: (parseFloat(quote.precio_regular) * exchangeRate).toFixed(2)
      }));

      // Aplicar los porcentajes a los precios devueltos
      const quotesWithPercentages = await this.applyPercentagesToQuote(mappedResponse);

      return {
        paqueterias: quotesWithPercentages
      };
    } catch (error) {
      console.error('Error en FedEx Quote API:', error.message);
      throw new Error('Error al obtener las cotizaciones de FedEx: ' + error.message);
    }
  }


  async applyPercentagesToQuote(quotes) {
    const fedexService = await Service.findOne({ name: 'Fedex' });
    if (!fedexService) {
      console.warn('No se encontraron porcentajes para FedEx');
      return quotes;
    }

    return quotes.map(quote => {
      const provider = fedexService.providers.find(p => p.name === 'Fedex');
      if (provider) {
        const service = provider.services.find(s => s.idServicio === quote.idServicio);
        if (service) {
          const percentage = service.percentage / 100 + 1; 
          quote.precio_regular = quote.precio;
          quote.precio = (parseFloat(quote.precio) * percentage).toFixed(2);          
        }
      }
      return quote;
    });
  }

  async createShipment(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildShipmentRequestBody(shipmentDetails);        
  
      const response = await axios.post(this.shipApiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
  
      // Procesar la respuesta
      return this.processShipmentResponse(response.data);
    } catch (error) {
      console.error('Error en FedEx Ship API:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
  
  async processShipmentResponse(responseData) {
    const shipment = responseData.output.transactionShipments[0];
    const labelData = shipment.pieceResponses[0].packageDocuments[0].encodedLabel;
    
    // Generar PDF y obtener el enlace
    const pdfLink = await this.generateLabelPDF(labelData, shipment.masterTrackingNumber);

    return {
      trackingNumber: shipment.masterTrackingNumber,
      serviceType: shipment.serviceType,
      serviceName: shipment.serviceName,
      shipDate: shipment.shipDatestamp,
      cost: shipment.pieceResponses[0].netRateAmount,
      labelLink: pdfLink
    };
  }

  async generateLabelPDF(encodedLabel, trackingNumber) {
    // Convertir pulgadas a puntos (1 pulgada = 72 puntos en PDF)
    const widthInPoints = 4 * 72;  // 4 pulgadas
    const heightInPoints = 6 * 72; // 6 pulgadas

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([widthInPoints, heightInPoints]);

    // Decodifica la etiqueta
    const imageBytes = Buffer.from(encodedLabel, 'base64');

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
    const outputPath = path.join(__dirname, '..', 'public', 'labels', `${trackingNumber}.pdf`);
    await fs.outputFile(outputPath, pdfBytes);

    // Retorna el enlace relativo al PDF
    return `/labels/${trackingNumber}.pdf`;
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshToken();
    }
  }

  async refreshToken() {
    try {
      const response = await axios.post(this.authUrl, 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret
        }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in * 1000);      
    } catch (error) {
      console.error('Error al obtener token de FedEx:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  isTokenExpired() {
    return !this.tokenExpiration || Date.now() >= this.tokenExpiration;
  }

  buildQuoteRequestBody(shipmentDetails) {
    return {
      accountNumber: {
        value: this.accountNumber
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: shipmentDetails.cp_origen,
            countryCode: shipmentDetails.pais_origen
          }
        },
        recipient: {
          address: {
            postalCode: shipmentDetails.cp_destino,
            countryCode: shipmentDetails.pais_destino
          }
        },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        rateRequestType: ["LIST", "ACCOUNT"],
        preferredCurrency: "NMP", // Aseguramos que siempre se use NMP (pesos mexicanos)
        requestedPackageLineItems: [{
          weight: {
            units: "KG",
            value: shipmentDetails.peso
          },
          dimensions: {
            length: shipmentDetails.largo,
            width: shipmentDetails.ancho,
            height: shipmentDetails.alto,
            units: "CM"
          }
        }]
      }
    };
  }

  buildShipmentRequestBody(shipmentDetails) {
    const shipDate = new Date();
    const shipDatestamp = shipDate.toISOString().split('T')[0];
  
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
                value: this.accountNumber
              }
            }
          }
        },
        labelSpecification: {
          labelStockType: shipmentDetails.impresion.tipo_papel,
          imageType: "PNG"
        },
        requestedPackageLineItems: [this.buildPackageDetails(shipmentDetails)],
        shipmentSpecialServices: this.buildShipmentSpecialServices(shipmentDetails),
        customsClearanceDetail: this.buildCustomsClearanceDetail(shipmentDetails)
      },
      accountNumber: {
        value: this.accountNumber
      }
    };
  }
  
  buildPartyDetails(party) {
    return {
      contact: {
        personName: party.name,
        phoneNumber: party.phone,
        companyName: party.name
      },
      address: {
        streetLines: [
          `${party.street} ${party.external_number}`,
          party.internal_number,
          party.settlement
        ].filter(Boolean),
        city: party.city,
        stateOrProvinceCode: party.iso_estado,
        postalCode: party.zip_code,
        countryCode: party.iso_pais,
        residential: false
      }
    };
  }
  
  buildPackageDetails(shipmentDetails) {    
    return {
      customerReferences: [
        {
          customerReferenceType: "CUSTOMER_REFERENCE",
          value: shipmentDetails.package.content || "N/A"
        }
      ],
      weight: {
        units: "KG",
        value: shipmentDetails.package.weight
      },
      dimensions: {
        length: shipmentDetails.package.length,
        width: shipmentDetails.package.width,
        height: shipmentDetails.package.height,
        units: "CM"
      },
      declaredValue: {
        amount: shipmentDetails.package.declared_value,
        currency: "NMP"
      },
      itemDescriptionForClearance: shipmentDetails.package.detailed_content || shipmentDetails.package.content
    };
  }
  
  buildCustomsClearanceDetail(shipmentDetails) {
    if (shipmentDetails.from.iso_pais === shipmentDetails.to.iso_pais) {
      return null; // No se necesita para envíos domésticos
    }
  
    return {
      dutiesPayment: {
        paymentType: "SENDER"
      },
      commodities: shipmentDetails.items.map(item => ({
        numberOfPieces: parseInt(item.cantidad_producto),
        description: item.descripcion_producto,
        countryOfManufacture: shipmentDetails.from.iso_pais,
        weight: {
          units: "KG",
          value: parseFloat(item.peso_producto)
        },
        quantity: parseInt(item.cantidad_producto),
        quantityUnits: item.clave_unidad,
        unitPrice: {
          amount: parseFloat(item.valor_producto),
          currency: "NMP"
        },
        customsValue: {
          amount: parseFloat(item.valor_producto) * parseInt(item.cantidad_producto),
          currency: "NMP" 
        }
      }))
    };
  }
  
  buildShipmentSpecialServices(shipmentDetails) {    
    return {
      specialServiceTypes: []
    };
  }
}

module.exports = new FedexService();