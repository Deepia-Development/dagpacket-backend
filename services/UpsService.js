const axios = require("axios");
const config = require("../config/config");
const moment = require("moment");
const ServiceSchema = require("../models/ServicesModel");

class UpsService {
  constructor() {
    this.apiBase = config.ups.apiBase;
    this.accessToken = null;
    this.client_id = config.ups.client_id;
    this.client_secret = config.ups.client_secret;
  }

  async getQuote(shipmentDetails) {
    try {
      await this.ensureValidToken();
    } catch (error) {
      console.error(
        "Error al obtener cotización con UPS:",
        error.response ? error.response.data : error.message
      );
      throw new Error(
        `Error al obtener cotización con UPS: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || this.accessToken === null) {
      await this.refreshToken();
    }
  }

  async refreshToken() {
    try {
      const response = axios.post(`${this.apiBase}/security/oauth/v1/token`, {
        grant_type: "client_credentials",
        client_id: this.client_id,
        client_secret: this.client_secret,
      });

      this.accessToken = response.data.access_token;
      console.log("Token de acceso de UPS actualizado:", this.accessToken);
    } catch (error) {
      console.error(
        "Error al refrescar token con UPS:",
        error.response ? error.response.data : error.message
      );
      throw new Error(
        `Error al refrescar token con UPS: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  }

  buildQuoteRequestBody(shipmentDetails) {

    
    return {
      originCountryCode: "MX",
      originStateProvince: "JAL",
      originCityName: "GUADALAJARA",
      originTownName: "",
      originPostalCode: "44100",
      destinationCountryCode: "MX",
      destinationStateProvince: "CDMX",
      destinationCityName: "CIUDAD DE MEXICO",
      destinationTownName: "",
      destinationPostalCode: "06000",
      weight: "5",
      weightUnitOfMeasure: "KGS",
      shipmentContentsValue: "1000",
      shipmentContentsCurrencyCode: "MXN",
      billType: "03",
      shipDate: "2024-12-10",
      shipTime: "",
      residentialIndicator: "",
      avvFlag: true,
      numberOfPackages: "1",
    };
  }
}

module.exports = new UpsService();
