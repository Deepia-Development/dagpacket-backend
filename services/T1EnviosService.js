const axios = require("axios");
const config = require("../config/config");
const Service = require("../models/ServicesModel");
const { mapShippingResponse } = require("../utils/t1Mapper");
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

      // console.log("Quote request body:", requestBody); // Muestra el cuerpo de la solicitud
      // console.log("Quote URL:", this.quoteUrl); // Muestra la URL de la solicitud
      // console.log("Access Token:", this.accessToken); // Muestra el token de acceso
      // console.log("Shop ID:", this.shopId); // Muestra el shop_id
      // console.log("Headers:", {
      //   "Content-Type": "application/json", // Tipo de contenido
      //   Authorization: `Bearer ${this.accessToken}`, // Token de autorización
      //   shop_id: this.shopId, // ID de la tienda
      // });

      // Mostrar la solicitud completa que se enviará
      // console.log("Request to be sent:", {
      //   url: this.quoteUrl, // URL de la API
      //   headers: {
      //     "Content-Type": "application/json", // Tipo de contenido
      //     Authorization: `Bearer ${this.accessToken}`, // Token de autorización
      //     shop_id: this.shopId, // ID de la tienda
      //   },
      //   data: requestBody, // Cuerpo de la solicitud
      // });

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
      //   console.log('ERROR:', error);
      throw "Error al obtener la cotización de t1: " + error.message;
    }
  }

  async applyPercentagesToQuote(quoteResponse) {
    const t1EnviosService = await Service.findOne({ name: "T1Envios" });
    console.log("Quote response t1:", quoteResponse);
    if (!t1EnviosService) {
      console.warn("No se encontraron porcentajes para T1Envios");
      return quoteResponse;
    }

    if (quoteResponse.paqueterias && Array.isArray(quoteResponse.paqueterias)) {
      // 🔥 Filtra AMPM antes del map
      quoteResponse.paqueterias = quoteResponse.paqueterias
        .filter((quote) => quote.proveedor.toLowerCase() !== "ampm")
        .map((quote) => {
          const provider = t1EnviosService.providers.find(
            (p) => p.name === quote.proveedor
          );

          if (!provider) {
            console.warn(
              `No se encontró el proveedor ${quote.proveedor} en la base de datos`
            );
            return null;
          }

          const service = provider.services.find(
            (s) => s.idServicio === quote.idServicio
          );
          if (!service) {
            console.warn(
              `No se encontró el servicio ${quote.idServicio} para el proveedor ${quote.proveedor}`
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
            precio: precio_venta.toFixed(2),
            precio_regular: precio_guia_lic.toFixed(2),
            precio_guia: precio_guia.toFixed(2),
            precio_api: precio.toFixed(2),
          };
        })
        .filter((quote) => quote !== null);
    }

    if (!quoteResponse.paqueterias || quoteResponse.paqueterias.length === 0) {
      console.log(
        "No se encontraron servicios activos después del filtrado t1"
      );
      return {
        ...quoteResponse,
        paqueterias: [],
      };
    }

    return quoteResponse;
  }

  async generateGuide(shipmentData) {
    try {
      // Asegurarse de que se tenga un token de acceso válido
      await this.ensureValidToken();

      // Verificar si existe un token de acceso
      if (!this.accessToken) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      // Construir el cuerpo de la solicitud
      const requestBody = await this.buildGuideRequestBody(shipmentData);

      console.log("Guide request body:", requestBody); // Muestra el cuerpo de la solicitud

      // Enviar la solicitud POST usando axios
      const response = await axios.post(this.labelUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          shop_id: this.shopId,
        },
      });

      console.log("Guide response:", response.data); // Muestra la respuesta de la API

      return response.data; // Devolver la respuesta de la API
    } catch (error) {
      throw error;
    }
  }

  async buildGuideRequestBody(shipmentData) {
    console.log(
      "Building guide request body with shipment data:",
      shipmentData
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
      separarNombreYApellidos(shipmentData.from.name);

    const { nombres: nombreDestino, apellidos: apellidosDestino } =
      separarNombreYApellidos(shipmentData.to.name);

    return {
      contenido: shipmentData.package.content,
      nombre_origen: nombreOrigen,
      apellidos_origen: apellidosOrigen,
      email_origen: shipmentData.from.email,
      calle_origen: shipmentData.from.street,
      numero_origen:
        shipmentData.from.external_number || shipmentData.from.internal_number,
      colonia_origen: shipmentData.from.settlement,
      telefono_origen: shipmentData.from.phone,
      estado_origen: shipmentData.from.state,
      municipio_origen: "123",
      referencias_origen:
        shipmentData.from.reference?.trim() !== ""
          ? shipmentData.from.reference
          : "No tiene referencia",
      nombre_destino: nombreDestino,
      apellidos_destino: apellidosDestino,
      email_destino: shipmentData.to.email,
      calle_destino: shipmentData.to.street,
      numero_destino:
        shipmentData.to.external_number || shipmentData.to.internal_number,
      colonia_destino: shipmentData.to.settlement,
      telefono_destino: shipmentData.to.phone,
      estado_destino: shipmentData.to.state,
      municipio_destino: "123",
      referencias_destino:
        shipmentData.to.reference?.trim() !== ""
          ? shipmentData.to.reference
          : "No tiene referencia",
      generar_recoleccion: false,
      tiene_notificacion: true,
      origen_guia: "t1envios",
      comercio_id: this.shopId,
      nombre_comercio_origen: "dagpacket",
      nombre_comercio_destino: "dagpacket",
      token_quote: shipmentData.token,
    };
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
