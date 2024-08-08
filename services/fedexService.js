const axios = require('axios');
const config = require('../config/fedex');

class FedexService {
  constructor() {
    this.baseUrl = 'https://apis-sandbox.fedex.com';
    this.rateApiUrl = `${this.baseUrl}/rate/v1/rates/quotes`;
    this.authUrl = `${this.baseUrl}/oauth/token`;
    this.accountNumber = config.accountNumber;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async getQuote(shipmentDetails) {
    try {
      await this.ensureValidToken();
      const requestBody = this.buildRequestBody(shipmentDetails);

      console.log('FedEx Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(this.rateApiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error en FedEx API:', error.response ? error.response.data : error.message);
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

  buildRequestBody(shipmentDetails) {
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
}

module.exports = new FedexService();