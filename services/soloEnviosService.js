const axios = require("axios");
const config = require("../config/config");
const Service = require("../models/ServicesModel");

class SoloEnviosService {
  constructor() {
    this.apiUrl = config.SoloEnvios.apiUrl;
    this.clientId = config.SoloEnvios.clientId;
    this.clientSecret = config.SoloEnvios.clientSecret;
    this.scope = config.SoloEnvios.scope;
    this.accessToken = null;
    this.tokenExpiration = null;
  }
  async refreshToken() {
    try {
      const response = await axios.post(
        `${this.apiUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: this.scope,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("Token refreshed successfully:", response.data);
      this.accessToken = response.data.access_token;
      this.tokenExpiration = response.data.expires_in;
      return response.data.access_token;
    } catch (error) {
      console.error(
        "Error refreshing token:",
        error.response ? error.response.data : error.message
      );
      throw new Error("Failed to refresh token");
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
      !shipmentDetails.cp_destino ||
      shipmentDetails.isInternational !== true
    ) {
      throw new Error("Datos de envío incompletos o el envío no es internacional");
    }

      // Si el envío NO es internacional, validar campos adicionales
    //   if (!shipmentDetails.isInternational) {
    //     if (
    //       !shipmentDetails.estado_origen ||
    //       !shipmentDetails.estado_destino ||
    //       !shipmentDetails.ciudad_origen ||
    //       !shipmentDetails.ciudad_destino
    //     ) {
    //       throw new Error("Datos de envío nacionales incompletos");
    //     }
    //   }

      const requestBody = await this.buildQuoteRequestBody(shipmentDetails);

      // Enviar la solicitud POST usando axios
      const response = await axios.post(this.quoteUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          shop_id: this.shopId,
        },
      });

      console.log("Quote response t1:", response.data); // Muestra la respuesta de la API

      console.log("Complete quote response:", response);

      // Esperar la resolución de la promesa antes de registrar la respuesta
      const quoteResponse = await response.data; // Asegurarse de que la promesa se resuelva
      // console.log("Quote response:", quoteResponse);
      const shippingMapped = mapShippingResponse(quoteResponse);

      const finalQuote = await this.applyPercentagesToQuote(shippingMapped);

      // console.log("Mapped Quote response:", mappedQuoteResponse);
      return finalQuote; // Devolver la respuesta mapeada
    } catch (error) {
      console.error("Error getting quote t1:", error.message);
      console.error(
        "Error details t1:",
        error.response ? error.response.data : error.message
      );
      console.log("ERROR:", error);
      throw "Error al obtener la cotización de t1: " + error.message;
    }
  }

  async buildQuotationRequestBody(shipmentDetails) {
  console.log(
    "Building quotation request body with shipment details:",
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
    quotation: {
      order_id: shipmentDetails.order_id || "",
      address_from: {
        country_code: shipmentDetails.pais_origen || "mx",
        postal_code: shipmentDetails.cp_origen,
        area_level1: shipmentDetails.estado_origen || "",
        area_level2: shipmentDetails.ciudad_origen || "",
        area_level3: shipmentDetails.colonia_origen || ""
      },
      address_to: {
        country_code: shipmentDetails.pais_destino || "mx",
        postal_code: shipmentDetails.cp_destino,
        area_level1: shipmentDetails.estado_destino || "",
        area_level2: shipmentDetails.ciudad_destino || "",
        area_level3: shipmentDetails.colonia_destino || ""
      },
      parcels: [
        {
          length: shipmentDetails.largo || 10,
          width: shipmentDetails.ancho || 10,
          height: shipmentDetails.alto || 10,
          weight: shipmentDetails.peso || 1
        }
      ],
      requested_carriers: shipmentDetails.carriers || ["fedex", "dhl"]
    }
  };
}
}
