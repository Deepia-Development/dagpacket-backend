const axios = require("axios");
const config = require("../config/config");
const Service = require("../models/ServicesModel");
const { mapUpsResponse } = require("../utils/UpsMapper");

class UpsService {
  constructor() {
    this.apiBase = config.ups.apiBase;
    this.accessToken = null;
    this.client_id = config.ups.client_id;
    this.client_secret = config.ups.client_secret;
    this.tokenExpiration = null;
    this.MAX_RETRIES = 3;
  }

  isTokenExpired() {
    return !this.tokenExpiration || Date.now() >= this.tokenExpiration;
  }

  async ensureValidToken() {
    try {
      if (!this.accessToken || this.isTokenExpired()) {
        console.log("Token de UPS no existe o ha expirado, refrescando...");
        await this.refreshToken();
      }
      return true;
    } catch (error) {
      console.error("Error en ensureValidToken:", error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      console.log("Iniciando proceso de refresh token con UPS...");
      const tokenUrl = `${this.apiBase}/security/v1/oauth/token`;

      // Crear la autenticación básica
      const basicAuth = Buffer.from(
        `${this.client_id}:${this.client_secret}`
      ).toString("base64");

      console.log("URL de token:", tokenUrl);
      console.log("Client ID:", this.client_id);
      console.log(
        "Client Secret (primeros 4 caracteres):",
        this.client_secret.substring(0, 4) + "..."
      );

      const params = new URLSearchParams({
        grant_type: "client_credentials",
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        validateStatus: null, // Para capturar todos los códigos de estado
      });

      // Log detallado de la respuesta
      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      });

      // Verificar si la respuesta no fue exitosa
      if (response.status !== 200) {
        const errorMessage = `Error en la autenticación: ${
          response.status
        } - ${JSON.stringify(response.data)}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Verificar si recibimos el token de acceso
      if (!response.data.access_token) {
        throw new Error("No se recibió el token de acceso en la respuesta");
      }

      // Guardar el token y su expiración
      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() + response.data.expires_in * 1000;

      console.log("Token de acceso obtenido exitosamente");
      console.log("Token:", this.accessToken);
      console.log("Expira en:", response.data.expires_in, "segundos");

      return true;
    } catch (error) {
      console.error("Error detallado al refrescar token:", {
        message: error.message,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        },
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data,
        },
      });

      throw new Error(`Error al refrescar token de UPS: ${error.message}`);
    }
  }

  async getQuote(shipmentDetails, retryCount = 0) {
    try {
      console.log("Iniciando proceso de cotización con UPS...");

      await this.ensureValidToken();

      if (!this.accessToken) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      const requestBody = await this.buildQuoteRequestBody(shipmentDetails);
      console.log("Enviando solicitud de cotización a UPS...");

      const rateUrl = `${this.apiBase}/api/rating/v2409/Rate`;
      console.log("URL de cotización:", rateUrl);

      const response = await axios.post(rateUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.data) {
        throw new Error("La respuesta no contiene datos");
      }

      console.log("Cotización recibida exitosamente");
      const mappedResponse = mapUpsResponse(response.data);
      console.log("Cotización mapeada:", mappedResponse);
      const quotesWithPercentages = await this.applyPercentagesToQuote(
        mappedResponse
      );
      return {
        paqueterias: quotesWithPercentages,
      };
    } catch (error) {
      console.error("Error detallado en getQuote:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });

      // Reintentar si es un error de autorización y no hemos excedido los reintentos
      if (error.response?.status === 401 && retryCount < this.MAX_RETRIES) {
        console.log(
          `Reintentando cotización (intento ${retryCount + 1} de ${
            this.MAX_RETRIES
          })...`
        );
        this.accessToken = null; // Forzar renovación del token
        return this.getQuote(shipmentDetails, retryCount + 1);
      }

      throw new Error(`Error al obtener cotización: ${error.message}`);
    }
  }

  async buildQuoteRequestBody(shipmentDetails) {
    if (!shipmentDetails.cp_origen || !shipmentDetails.cp_destino) {
      throw new Error("Códigos postales requeridos");
    }
    return {
      RateRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: `Quote-${Date.now()}`,
            TransactionIdentifier: `TID-${Date.now()}`,
          },
          SubVersion: "2205",
        },
        Shipment: {
          Shipper: {
            Name: "Dagpacket",
            ShipperNumber: "6971VV",
            Address: {
              AddressLine: ["Ing. Lucio Gutiérrez 91"],
              PostalCode: shipmentDetails.cp_origen,
              CountryCode: shipmentDetails.pais_origen,
            },
          },
          ShipTo: {
            Name: "Destinatario",
            Address: {
              PostalCode: shipmentDetails.cp_destino,
              CountryCode: shipmentDetails.pais_destino,
            },
          },
          ShipFrom: {
            Name: "Remitente",
            Address: {
              PostalCode: shipmentDetails.cp_origen,
              CountryCode: shipmentDetails.pais_origen,
            },
          },
          Service: {
            Code: "65",
          },
          Package: {
            PackagingType: {
              Code: "02",
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "CM",
              },
              Length: String(shipmentDetails.largo),
              Width: String(shipmentDetails.ancho),
              Height: String(shipmentDetails.alto),
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: "KGS",
              },
              Weight: String(shipmentDetails.peso),
            },
          },
        },
      },
    };
  }

  async applyPercentagesToQuote(quotes) {
    const upsService = await Service.findOne({ name: "UPS" });
    console.log("Servicio de UPS:", upsService);
    if (!upsService) {
      console.warn("No se encontraron porcentajes para ups");
      return quotes;
    }

    return quotes.map((quote) => {
      const provider = upsService.providers[0];
      console.log("Proveedor de UPS:", provider);
      const service = provider.services.find(
        (s) => s.idServicio === quote.idServicio
      );

      console.log("Servicio de UPS:", service);

      if (!service) {
        quote.status = false;
        return quote;
      }

      const precio_base = parseFloat(quote.precio) || 0; // Asegúrate de que quote.precio sea un número
      const porcentaje_servicio = parseFloat(service.percentage) || 0; // Asegúrate de que service.porcentaje sea un número

      const precio_guia = precio_base / 0.95;
      const precio_venta = precio_guia / (1 - porcentaje_servicio / 100);
      const utilidad = precio_venta - precio_guia;
      const utilidad_dagpacket = utilidad * 0.3;
      const precio_guia_lic = precio_guia + utilidad_dagpacket;


      console.log("Precio base:", precio_base);
      console.log("Porcentaje de servicio:", porcentaje_servicio);
      console.log("Precio guía:", precio_guia);
      console.log("Precio venta:", precio_venta);
      console.log("Utilidad:", utilidad);
      console.log("Utilidad Dagpacket:", utilidad_dagpacket);
      console.log("Precio guía con licencia:", precio_guia_lic);


      quote.precio = precio_venta.toFixed(2);
      quote.precio_regular = precio_guia_lic.toFixed(2);

      return {
        ...quote,
        precio_guia: precio_guia.toFixed(2),
        status: service.status,
      };
    });
  }
}

module.exports = new UpsService();
