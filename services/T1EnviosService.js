const axios = require("axios");
const config = require("../config/config");
const Service = require("../models/ServicesModel");
const {mapShippingResponse} = require("../utils/t1Mapper");
class T1EnviosService {
  constructor() {
    this.authUrl = config.t1Envios.T1_URL_AUTH;
    this.quoteUrl = config.t1Envios.T1_URL_QUOTE;
    this.labelUrl = config.t1Envios.T1_URL_LABEL;
    this.clientId = config.t1Envios.CLIENT_ID;
    this.clientSecret = config.t1Envios.CLIENT_SECRET;
    this.username = config.t1Envios.USERNAME;
    this.password = config.t1Envios.PASSWORD;
    this.shopId = config.t1Envios.SHOP_ID;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async refreshToken() {
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("client_id", this.clientId);
      params.append("client_secret", this.clientSecret);
      params.append("username", this.username);
      params.append("password", this.password);

      console.log("Requesting new token with params:", params.toString());

      const response = await axios.post(
        this.authUrl,
        params, // ya no es un objeto JSON, sino URLSearchParams
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("Token responset1:", response.data);
      this.accessToken = response.data.access_token;
      this.tokenExpiration = response.data.expires_in; // Token expiration time in seconds
    } catch (error) {
      if (error.response && error.response.data) {
        console.error("Error details t1:", error.response.data);
      } else {
        console.error("Error details t1:", error.message);
      }
      throw error;
    }
  }

  isTokenExpired() {
    return !this.tokenExpiration || Date.now() >= this.tokenExpiration * 1000;
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      console.log("Token inválido o expirado. Refrescando token...");
      await this.refreshToken();
    }
  }

  async getQuote(shipmentDetails) {
    console.log("Getting quote for shipment details:", shipmentDetails);

    try {
      // Asegurarse de que se tenga un token de acceso válido
      await this.ensureValidToken();

      // Verificar si existe un token de acceso
      if (!this.accessToken) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      // Verificar que los datos del envío sean completos
      if (
        !shipmentDetails ||
        !shipmentDetails.cp_origen ||
        !shipmentDetails.cp_destino
      ) {
        throw new Error("Datos de envío incompletos");
      }

      // Construir el cuerpo de la solicitud
      const requestBody = await this.buildQuoteRequestBody(shipmentDetails);

      console.log("Quote request body:", requestBody); // Muestra el cuerpo de la solicitud
      console.log("Quote URL:", this.quoteUrl); // Muestra la URL de la solicitud
      console.log("Access Token:", this.accessToken); // Muestra el token de acceso
      console.log("Shop ID:", this.shopId); // Muestra el shop_id
      console.log("Headers:", {
        "Content-Type": "application/json", // Tipo de contenido
        Authorization: `Bearer ${this.accessToken}`, // Token de autorización
        shop_id: this.shopId, // ID de la tienda
      });

      // Mostrar la solicitud completa que se enviará
      console.log("Request to be sent:", {
        url: this.quoteUrl, // URL de la API
        headers: {
          "Content-Type": "application/json", // Tipo de contenido
          Authorization: `Bearer ${this.accessToken}`, // Token de autorización
          shop_id: this.shopId, // ID de la tienda
        },
        data: requestBody, // Cuerpo de la solicitud
      });

      // Enviar la solicitud POST usando axios
      const response = await axios.post(this.quoteUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          shop_id: this.shopId,
        },
      });

      // Esperar la resolución de la promesa antes de registrar la respuesta
      const quoteResponse = await response.data; // Asegurarse de que la promesa se resuelva
      console.log("Quote response:", quoteResponse);
      const mappedQuoteResponse = mapShippingResponse(quoteResponse);
      console.log("Mapped Quote response:", mappedQuoteResponse);
      return {
        paqueterias: mappedQuoteResponse,
      };
    } catch (error) {
      console.error("Error getting quote t1:", error.message);
      console.error(
        "Error details t1:",
        error.response ? error.response.data : error.message
      );
      //   console.log('ERROR:', error);
      throw "Error al obtener la cotización de t1: " + error.message;
    }
  }

  async buildQuoteRequestBody(shipmentDetails) {
    console.log(
      "Building quote request body with shipment details:",
      shipmentDetails
    );

    if (
      !shipmentDetails ||
      !shipmentDetails.cp_origen ||
      !shipmentDetails.cp_destino
    ) {
      throw new Error("Campos 'cp_origen' y 'cp_destino' son requeridos");
    }

    return {
      codigo_postal_origen: shipmentDetails.cp_origen || "Valor predeterminado", // Asegúrate de que estos campos no sean undefined
      codigo_postal_destino:
        shipmentDetails.cp_destino || "Valor predeterminado",
      peso: shipmentDetails.peso || 1, // Asegúrate de que estos valores sean numéricos
      largo: shipmentDetails.largo || 1,
      ancho: shipmentDetails.ancho || 1,
      alto: shipmentDetails.alto || 1,
      dias_embarque: 1,
      seguro: shipmentDetails.seguro > 0 ? true : false,
      valor_paquete: shipmentDetails.valor_declarado || 0,
      tipo_paquete: shipmentDetails.tipo_paquete === "Sobre" ? 1 : 2,
      comercio_id: this.shopId,
      paquetes: 1,
      generar_recoleccion: false,
    };
  }
}

module.exports = new T1EnviosService();
