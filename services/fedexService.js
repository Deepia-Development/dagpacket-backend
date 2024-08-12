const axios = require('axios');
const config = require('../config/config');

class FedexService {
  constructor() {
    this.baseUrl = config.fedex.apiUrl;
    this.rateApiUrl = `${this.baseUrl}/rate/v1/rates/quotes`;
    this.shipApiUrl = `${this.baseUrl}/ship/v1/shipments`;
    this.authUrl = `${this.baseUrl}/oauth/token`;
    this.accountNumber = config.fedex.accountNumber;
    this.clientId = config.fedex.clientId;
    this.clientSecret = config.fedex.apiSecret;  // Cambiamos esto para usar apiSecret
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async getQuote(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildQuoteRequestBody(shipmentDetails);

      console.log('FedEx Quote Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(this.rateApiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error en FedEx Quote API:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async createShipment(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildShipmentRequestBody(shipmentDetails);

      console.log('FedEx Shipment Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(this.shipApiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error en FedEx Ship API:', error.response ? error.response.data : error.message);
      throw error;
    }
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
      console.log('Nuevo token de FedEx obtenido');
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
        preferredCurrency: "MXN",
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
    return {
      requestedShipment: {
        shipper: this.buildPartyDetails(shipmentDetails.from),
        recipients: [this.buildPartyDetails(shipmentDetails.to)],
        shipDatestamp: new Date(shipmentDetails.distribution_at).toISOString().split('T')[0],
        serviceType: shipmentDetails.idService,
        packagingType: shipmentDetails.shipment_type === 'Sobre' ? 'FEDEX_ENVELOPE' : 'YOUR_PACKAGING',
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
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
          imageType: "PDF",
          labelStockType: "PAPER_85X11_TOP_HALF_LABEL"
        },
        requestedPackageLineItems: [this.buildPackageDetails(shipmentDetails)],
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
        emailAddress: party.email
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
        countryCode: party.conutry_code,
        residential: false
      }
    };
  }

  buildPackageDetails(shipmentDetails) {
    return {
      weight: {
        units: "KG",
        value: shipmentDetails.shipment_data.package_weight
      },
      dimensions: {
        length: shipmentDetails.shipment_data.length,
        width: shipmentDetails.shipment_data.width,
        height: shipmentDetails.shipment_data.height,
        units: "CM"
      },
      customerReferences: [
        {
          customerReferenceType: "CUSTOMER_REFERENCE",
          value: shipmentDetails.description || "N/A"
        }
      ]
    };
  }

  buildCustomsClearanceDetail(shipmentDetails) {
    if (shipmentDetails.from.conutry_code === shipmentDetails.to.conutry_code) {
      return null; // No se necesita para envíos domésticos
    }

    return {
      dutiesPayment: {
        paymentType: "SENDER"
      },
      commodities: [{
        numberOfPieces: 1,
        description: shipmentDetails.description || "Merchandise",
        countryOfManufacture: shipmentDetails.from.conutry_code,
        weight: {
          units: "KG",
          value: shipmentDetails.shipment_data.package_weight
        },
        quantity: 1,
        quantityUnits: "PCS",
        unitPrice: {
          amount: parseFloat(shipmentDetails.insurance) || 1,
          currency: "MXN"
        },
        customsValue: {
          amount: parseFloat(shipmentDetails.insurance) || 1,
          currency: "MXN"
        }
      }]
    };
  }
}

module.exports = new FedexService();