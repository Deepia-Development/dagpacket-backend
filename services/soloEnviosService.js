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
        throw new Error(
          "Datos de envío incompletos o el envío no es internacional"
        );
      }

      const requestBody = await this.buildQuotationRequestBody(shipmentDetails);
      console.log("Request body for quote:", requestBody);
      // Crear cotización inicial
      const response = await axios.post(
        `${this.apiUrl}/quotations`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
            shop_id: this.shopId,
          },
        }
      );

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
        const statusRes = await axios.get(
          `${this.apiUrl}/quotations/${quotationId}`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              shop_id: this.shopId,
            },
          }
        );

        finalQuote = statusRes.data;
        completed = finalQuote?.is_completed;

        if (!completed) {
          attempts++;
          console.log(`Intento ${attempts}: cotización aún no completada...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (!completed) {
        throw new Error(
          "La cotización no se completó después de múltiples intentos."
        );
      }

      console.log("Cotización completada, mapeando resultados...");

      const mappedQuoteResponse = mapShippingResponse(finalQuote);

      const appliedQuote = await this.applyPercentagesToQuote(
        mappedQuoteResponse
      );

      console.log(
        "Cotización final después de aplicar porcentajes:",
        appliedQuote
      );
      return appliedQuote;
    } catch (error) {
      console.error("Error getting quote t1:", error.message);
      console.error(
        "Error details t1:",
        error.response ? error.response.data : error.message
      );
      throw "Error al obtener la cotización de t1: " + error.message;
    }
  }

  async applyPercentagesToQuote(quoteResponse) {
    const soloEnviosService = await Service.findOne({ name: "soloenvios" });
    console.log("Servicio SoloEnvios encontrado:", soloEnviosService);
    console.log("Cotización antes de aplicar porcentajes:", quoteResponse);

    if (!soloEnviosService) {
      return quoteResponse; // ← corregido: antes decía 'quote' (no definido)
    }

    if (quoteResponse.paqueterias && Array.isArray(quoteResponse.paqueterias)) {
      quoteResponse.paqueterias = quoteResponse.paqueterias
        .map((quote) => {
          const provider = soloEnviosService.providers.find(
            (p) => p.name === quote.proveedor
          );

          if (!provider) {
            console.warn(
              `No se encontró el proveedor ${quote.proveedor} en la base de datos`
            );
            return null;
          }

          const service = provider.services.find(
            (s) => s.idServicio === quote.provider_service_code
          );
          if (!service) {
            console.warn(
              `No se encontró el servicio ${quote.provider_service_code} para el proveedor ${quote.proveedor}`
            );
            return null;
          }

          const precio = parseFloat(quote.precio_regular);
          let precio_guia = precio / 0.95;
          let precio_venta = precio_guia / (1 - service.percentage / 100);
          const utilidad = precio_venta - precio_guia;
          const utilidad_dagpacket = utilidad * 0.3;
          const precio_guia_lic = precio_guia + utilidad_dagpacket;

          console.log("Precio Api:", precio);
          console.log("Precio Guía:", precio_guia);
          console.log("Precio Guía Lic:", precio_guia_lic);
          console.log("Precio Venta:", precio_venta);
          console.log("Utilidad:", utilidad);
          console.log("Utilidad Dagpacket:", utilidad_dagpacket);

          return {
            ...quote,
            status: service.status,
            servicio: "soloenvios",
            precio: precio_venta.toFixed(2),
            precio_regular: precio_guia_lic.toFixed(2),
            precio_guia: precio_guia.toFixed(2),
            precio_api: precio.toFixed(2),
          };
        })
        .filter((quote) => quote !== null);
    }

    return quoteResponse; // ← Este return es esencial
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

    const shipmentUrl = `${this.apiUrl}/shipments/${response.data.data.id}`;
    
    // Función para esperar a que el workflow_status sea success
    const waitForShipmentSuccess = async (maxRetries = 10, interval = 3000) => {
      let retries = 0;

      while (retries < maxRetries) {
        const getInformationShipment = await axios.get(
          shipmentUrl,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );

        const status = getInformationShipment.data.data.attributes.workflow_status;
        console.log(`Checking shipment status (attempt ${retries + 1}):`, status);

        if (status === "success") {
          console.log("Shipment processed successfully!");
          return getInformationShipment.data;
        } else if (status !== "in_progress") {
          throw new Error(`Shipment failed or is in an unexpected state: ${status}`);
        }

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, interval));
        retries++;
      }

      throw new Error("Timeout waiting for shipment to be processed successfully.");
    };

    // Esperar a que el shipment sea exitoso
    const finalShipmentData = await waitForShipmentSuccess();
    
    console.log("Response from getting shipment:", finalShipmentData);
    
    return finalShipmentData; // Devolver la respuesta final

  } catch (error) {
    console.error("Error creating shipment:", error.message);
    console.log(
      "Error details:",
      error.response ? error.response.data : error.message
    );
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
        requested_carriers: shipmentDetails.carriers || [
          "fedex",
          "dhl",
          "paquetexpress",
          "estafeta",
          "ups",
        ],
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
