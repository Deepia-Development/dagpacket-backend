const axios = require("axios");
const config = require("../config/config");
const Service = require("../models/ServicesModel");
const { mapShippingResponse } = require("../utils/soloEnviosMapper");

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

      console.log("Petition :", `${this.apiUrl}/oauth/token`);
      console.log("Client ID:", this.clientId);
      console.log("Client Secret:", this.clientSecret);
      console.log("Scope:", this.scope);
      // Realizar la petición POST para obtener el token de acceso
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
    await this.ensureValidToken();

    if (!this.accessToken) {
      throw new Error("No se pudo obtener el token de acceso");
    }

    if (
      !shipmentDetails ||
      !shipmentDetails.cp_origen ||
      !shipmentDetails.cp_destino
    ) {
      throw new Error("Datos de envío incompletos o el envío no es internacional");
    }

    const requestBody = await this.buildQuotationRequestBody(shipmentDetails);
    console.log("Request body for quote:", requestBody);  
    // Crear cotización inicial
    const response = await axios.post(`${this.apiUrl}/quotations`, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        shop_id: this.shopId,
      },
    });

    const quoteResponse = response.data;
    const quotationId = quoteResponse.id;

    if (!quotationId) {
      throw new Error("No se recibió un ID de cotización");
    }

    // Esperar a que is_completed sea true
    let completed = false;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 1500;

    let finalQuote = null;

    while (!completed && attempts < maxAttempts) {
      const statusRes = await axios.get(`${this.apiUrl}/quotations/${quotationId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          shop_id: this.shopId,
        },
      });

      finalQuote = statusRes.data;
      completed = finalQuote?.is_completed;

      if (!completed) {
        attempts++;
        console.log(`Intento ${attempts}: cotización aún no completada...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!completed) {
      throw new Error("La cotización no se completó después de múltiples intentos.");
    }

    console.log("Cotización completada, mapeando resultados...");

    const mappedQuoteResponse = mapShippingResponse(finalQuote);
    return mappedQuoteResponse;

  } catch (error) {
    console.error("Error getting quote t1:", error.message);
    console.error("Error details t1:", error.response ? error.response.data : error.message);
    throw "Error al obtener la cotización de t1: " + error.message;
  }
}

  async generateGuide(shipmentDetails) {
    try {
      await this.ensureValidToken();

      if (!this.accessToken) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      const requestBody = await this.buildGuideRequestBody(shipmentDetails);

      console.log("Request body for creating shipment:", requestBody);

      const response = await axios.post(
        `${this.apiUrl}/shipments/`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      console.log("Shipment created successfully:", response.data);

      return response.data; // Devolver la respuesta de la API

    } catch (error) {
      console.error("Error creating shipment:", error.message);
      console.log("Error details:", error.response ? error.response.data : error.message);
      throw new Error("Error al crear el envío: " + error.message);
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
          area_level3: shipmentDetails.colonia_origen || "",
        },
        address_to: {
          country_code: shipmentDetails.pais_destino || "mx",
          postal_code: shipmentDetails.cp_destino,
          area_level1: shipmentDetails.estado_destino || "",
          area_level2: shipmentDetails.ciudad_destino || "",
          area_level3: shipmentDetails.colonia_destino || "",
        },
        parcels: [
          {
            length: shipmentDetails.largo || 10,
            width: shipmentDetails.ancho || 10,
            height: shipmentDetails.alto || 10,
            weight: shipmentDetails.peso || 1,
          },
        ],
        requested_carriers: shipmentDetails.carriers || 
        ["fedex", "dhl",
          'tresguerras',
          'ampm','quiken'
          ,'paquetexpress'
          ,'carssa','99minutos.com','sendex','j&texpress','estafeta','ups'],
      },
    };
  }

  async buildGuideRequestBody(shipmentDetails) {
    console.log(
      "Building guide request body with shipment data:",
      shipmentDetails
    );

    function separarNombreYApellidos(nombreCompleto) {
      console.log("Separando nombre y apellidos de:", nombreCompleto);
      const partes = nombreCompleto.trim().split(/\s+/);

      if (partes.length >= 3) {
        const apellidos = partes.slice(-2).join(" ");
        const nombres = partes.slice(0, -2).join(" ");
        return { nombres, apellidos };
      } else if (partes.length === 2) {
        return {
          nombres: partes[0],
          apellidos: partes[1],
        };
      } else {
        return {
          nombres: nombreCompleto,
          apellidos: "",
        };
      }
    }

    const { nombres: nombreOrigen, apellidos: apellidosOrigen } =
      separarNombreYApellidos(shipmentDetails.from.name);

    const { nombres: nombreDestino, apellidos: apellidosDestino } =
      separarNombreYApellidos(shipmentDetails.to.name);

    return {
      shipment: {
        rate_id: shipmentDetails.token,
        printing_format: "thermal",
        address_from: {
          street1: shipmentDetails.from.street,
          name: shipmentDetails.from.name,
          company: "DagPacket",
          phone: shipmentDetails.from.phone,
          email: shipmentDetails.from.email,
          reference: shipmentDetails.from.reference || "Oficina principal",
        },
        address_to: {
          street1: shipmentDetails.to.street,
          name: shipmentDetails.to.name,
          company: "DagPacket",
          phone: shipmentDetails.to.phone,
          email: shipmentDetails.to.email,
          reference: shipmentDetails.to.reference || "Recepción principal",
        },
        packages: [
          {
            package_number: "1",
            package_protected: shipmentDetails.seguro > 0 ? true : false,
            declared_value: shipmentDetails.valor_declarado || 0,
            consignment_note:
              shipmentDetails.package?.consignment_note || "53102400",
            package_type: shipmentDetails.package?.type || "4G",
          },
        ],
      },
    };
  }
}


module.exports = new SoloEnviosService();