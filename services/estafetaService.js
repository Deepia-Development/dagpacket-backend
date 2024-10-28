const axios = require("axios");
const config = require('../config/config')
const fs = require("fs");
const path = require("path");
const Service = require("../models/ServicesModel");
const { estafetaMapResponse } = require("../utils/estafetaMaper");

class EstafetaService {
  constructor() {
    this.apiUrl = config.estafeta.apiUrl;
    this.token = config.estafeta.token;
    this.apiKey = config.estafeta.apiKey;
    this.apiSecret = config.estafeta.apiSecret;
    this.customerId = config.estafeta.customerId;
    this.salesId = config.estafeta.salesId;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async getQuote(shipmentDetails) {
    try {
      await this.ensureValidToken();

      if (
        !shipmentDetails ||
        !shipmentDetails.cp_origen ||
        !shipmentDetails.cp_destino
      ) {
        throw new Error("Datos de envío incompletos");
      }

      const requestBody = await this.buildQuoteRequestBody(shipmentDetails);

      const response = await axios.post(this.apiUrl, requestBody, {
        haeders: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          'apiKey': this.apiKey,

        },
      });

      let mappedResponse = estafetaMapResponse(response.data, shipmentDetails);

      mappedResponse = await this.applyPercentagesToQuote(mappedResponse);

      return {
        paqueterias: mappedResponse,
      };
    } catch (err) {
        console.error('ApiKey:', this.apiKey)
      console.error("Error en Estafeta Quote API:", err);
      if(err.response) {
        console.error("Datos de respuesta de error:", JSON.stringify(err.response.data));
        console.error("Estado de respuesta de error:", err.response.status);
        console.error("Cabeceras de respuesta de error:", JSON.stringify(err.response.headers));

      }else if(err.request) {
        console.error("No se recibió respuesta. Detalles de la solicitud:", JSON.stringify(err.request));
      }

      throw new Error(
        "Error al obtener las cotizaciones de Estafeta: " + err.message
      );
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshToken();
    }
  }

  async refreshToken() {
    try {
      const response = await axios.post(
        this.token,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.apiKey,
          client_secret: this.apiSecret,
          scope: "execute",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiration =
        new Date().getTime() + response.data.expires_in * 1000;
    } catch (err) {
      console.error("Error al obtener token:", err);
    }
  }

  async applyPercentagesToQuote(quotes) {
    const estafetaService = await Service.findOne({ name: "Estafeta" });
    if (!estafetaService) {
      console.warn("No se encontraron porcentajes para Estafeta");
      return quotes;
    }

    return quotes.map((quote) => {
      const provider = estafetaService.providers.find(
        (p) => p.name === "Estafeta"
      );
      if (provider) {
        const service = provider.services.find(
          (s) => s.idServicio === quote.idServicio
        );
        if (service) {
          const percentage = service.percentage / 100 + 1;
          quote.precio_regular = quote.precio;
          quote.precio = (parseFloat(quote.precio) * percentage).toFixed(2);
        }
      }
      return quote;
    });
  }

  isTokenExpired() {
    return !this.tokenExpiration || new Date().getTime() > this.tokenExpiration;
  }

  async buildQuoteRequestBody(shipmentDetails) {
    return {
      Origin: shipmentDetails.cp_origen,
      Destination: [shipmentDetails.cp_destino],
      PackagingType: shipmentDetails.tipo_paquete,
      IsInsurance: shipmentDetails.seguro,
      ItemValue: shipmentDetails.valor_declarado,
      Dimensions: {
        Length: shipmentDetails.alto,
        Width: shipmentDetails.ancho,
        Height: shipmentDetails.largo,
        Weight: shipmentDetails.peso,
      },
    };
  }
}


module.exports = new EstafetaService();