const config = require("../config/config");
const axios = require("axios");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

class SoloEnviosEndpoints {
  constructor() {
    this.apiUrl = config.SoloEnvios.apiUrl;
    this.clientId = config.SoloEnvios.clientId;
    this.clientSecret = config.SoloEnvios.clientSecret;
    this.scope = config.SoloEnvios.scope;

    // Cache en memoria
    this.accessToken = null;
    this.tokenExpirationTime = null; // Timestamp (ms)
  }

  async refreshToken() {
    try {
      console.log("Solicitando nuevo token...");
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

      const { access_token, expires_in } = response.data;

      // Guardar en cache (en memoria)
      this.accessToken = access_token;
      this.tokenExpirationTime = Date.now() + (expires_in - 30) * 1000; // restamos 30s de margen

      console.log(
        "✅ Token guardado en caché hasta:",
        new Date(this.tokenExpirationTime).toISOString()
      );
      return access_token;
    } catch (error) {
      console.error(
        "Error refreshing token:",
        error.response ? error.response.data : error.message
      );
      throw new Error("Failed to refresh token");
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpirationTime) {
      console.log("🔄 Token inválido o expirado. Refrescando...");
      await this.refreshToken();
    } else {
      console.log("✅ Token válido en caché, reutilizando...");
    }
  }

async getProducts(req) {
  try {
    const { data } = req.body; // Ejemplo: "MX"
    console.log("Request data:", data);

    await this.ensureValidToken();

    // Cuerpo base para los parámetros
    let params = {
      page: 1,
      "filters[destination_country_code]": data,
    };

    let allProducts = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`📦 Obteniendo página ${params.page}...`);

      const response = await axios.get(`${this.apiUrl}/products`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params,
      });

      const responseData = response.data?.data || [];
      const meta = response.data?.meta || {};

      // Agregar productos actuales al total
      allProducts.push(...responseData);

      // Verificar si hay más páginas
      if (meta.next_page) {
        params.page = meta.next_page; // avanzar
      } else {
        hasMore = false; // no más páginas
      }
    }

    console.log(`✅ Total de productos obtenidos: ${allProducts.length}`);

    return dataResponse("Productos obtenidos exitosamente", {
      total: allProducts.length,
      data: allProducts,
    });
  } catch (error) {
    console.error(
      "Error fetching products:",
      error.response ? error.response.data : error.message
    );
    return errorResponse(
      "Error al obtener los productos: " +
        (error.response ? JSON.stringify(error.response.data) : error.message)
    );
  }
}

}

module.exports = new SoloEnviosEndpoints();
