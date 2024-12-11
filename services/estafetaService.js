const axios = require("axios");
const config = require("../config/config");
const fs = require("fs");
const path = require("path");
const Service = require("../models/ServicesModel");
const { mapEstafetaResponse } = require("../utils/estafetaMaper");

class EstafetaService {
  constructor() {
    this.apiUrl = config.estafeta.apiUrl;
    this.labelUrl = config.estafeta.labelUrl;
    this.token = config.estafeta.token;
    this.apiKey = config.estafeta.apiKey;
    this.apiSecret = config.estafeta.apiSecret;
    this.apiKeyLabel = config.estafeta.apiKeyLabel;
    this.apiSecretLabel = config.estafeta.apiSecretLabel;
    this.customerId = config.estafeta.customerId;
    this.salesId = config.estafeta.salesId;
    this.trackingUrl = config.estafeta.trackingUrl;
    this.trackingApiKey = config.estafeta.trackingApiKey;
    this.trackingApiSecret = config.estafeta.trackingApiSecret;
    this.accessTokenLabel = null;
    this.accessToken = null;
    this.accessTokenTracking = null;
    this.tokenExpiration = null;
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      console.log("Token inválido o expirado. Refrescando token...");
      await this.refreshToken();
    }
  }

  async ensureValidTokenTracking() {
    if (!this.accessTokenTracking || this.isTokenExpired()) {
      console.log("Token inválido o expirado. Refrescando token...");
      await this.refreshTokenTracking();
    }
  }

  async ensureValidTokenLabel() {
    if (!this.accessTokenLabel || this.isTokenExpired()) {
      console.log("Token inválido o expirado. Refrescando token...");
      await this.refreshTokenLabel();
    }
  }

  async refreshTokenLabel() {
    try {
      console.log("Obteniendo nuevo token...");
      const response = await axios.post(
        this.token,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.apiKeyLabel,
          client_secret: this.apiSecretLabel,
          scope: "execute",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("Token:", response.data.access_token);
      this.accessTokenLabel = response.data.access_token;
      this.tokenExpiration =
        new Date().getTime() + response.data.expires_in * 1000;
    } catch (err) {
      console.error("Error al obtener token:", err);
    }
  }

  async refreshTokenTracking() {
    try {
      console.log("Obteniendo nuevo token...");
      console.log("this.trackingApiKey:", this.trackingApiKey);
      console.log("this.trackingApiSecret:", this.trackingApiSecret);
      console.log("this.token:", this.token);
      const response = await axios.post(
        this.token,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.trackingApiKey,
          client_secret: this.trackingApiSecret,
          scope: "execute",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("Token:", response.data.access_token);
      this.accessTokenTracking = response.data.access_token;
      this.tokenExpiration =
        new Date().getTime() + response.data.expires_in * 1000;
    } catch (err) {
      console.error("Error al obtener token:", err);
    }
  }

  async trackGuide(trackingNumber) {
    try {
      await this.ensureValidTokenTracking();

      if (!this.accessTokenTracking) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      const requestBody = this.buildRequestTracking(trackingNumber);

      console.log("Request body de tracking:", requestBody);

      const response = await axios.post(this.trackingUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessTokenTracking}`,
          apiKey: this.trackingApiKey,
        },
      });

      console.log("Respuesta de Estafeta Tracking API:", response.data);

      return response.data;
    } catch (err) {
      console.error("Error al obtener la el envio de Estafeta:", err);
      throw new Error("Error al obtener la el envio de Estafeta: " + err.message);
    }
  }

  buildRequestTracking(trackingNumber) {
    console.log("Datos de envío para Estafeta en buildRequestTracking:", trackingNumber);
    console.log('this.customerId:', this.customerId);
   
    let clientNumber = String(this.customerId);

    console.log('clientNumber:', clientNumber);
    return {
      inputType: 0,
      itemReference: {
        clientNumber: clientNumber,
        referenceCode: ["string"],
      },
      itemsSearch: [trackingNumber],
      searchType: 1,
    };
  }

  async refreshToken() {
    try {
      console.log("Obteniendo nuevo token...");
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
      console.log("Token:", response.data.access_token);
      this.accessToken = response.data.access_token;
      this.tokenExpiration =
        new Date().getTime() + response.data.expires_in * 1000;
    } catch (err) {
      console.error("Error al obtener token:", err);
    }
  }

  async getQuote(shipmentDetails) {
    console.log("Datos de envío para Estafeta:", shipmentDetails);
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
        throw new Error("Datos de envío incompletos");
      }

      const requestBody = await this.buildQuoteRequestBody(shipmentDetails);
      console.log("Request body:", requestBody);

      console.log("headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        apiKey: this.apiKey,
        Customer: this.customerId,
        Sales_organization: this.salesId,
      });
      console.log("URL:", this.apiUrl);
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          apiKey: this.apiKey,
          Customer: this.customerId,
          Sales_organization: this.salesId,
        },
      });

      // Customer: this.customerId,
      // Sales_organization: this.salesId,

      console.log("Respuesta de Estafeta Quote API:", response.data.Quotation);

      let mappedResponse = mapEstafetaResponse(response.data, shipmentDetails);

      mappedResponse = await this.applyPercentagesToQuote(mappedResponse);

      return {
        paqueterias: mappedResponse,
      };
    } catch (err) {
      if (err.response) {
        console.error(
          "Datos de respuesta de error:",
          JSON.stringify(err.response.data)
        );
        console.error("Estado de respuesta de error:", err.response.status);
        // console.error("Cabeceras de respuesta de error:", JSON.stringify(err.response.headers));
        console.error("ApiKey error:", this.apiKey);
      } else if (err.request) {
        console.error(
          "No se recibió respuesta. Detalles de la solicitud:",
          JSON.stringify(err.request)
        );
      }

      throw new Error(
        "Error al obtener las cotizaciones de Estafeta: " + err.message
      );
    }
  }

  // async applyPercentagesToQuote(quotes) {
  //   const estafetaService = await Service.findOne({ name: "Estafeta" });
  //   if (!estafetaService) {
  //     console.warn("No se encontraron porcentajes para Estafeta");
  //     return quotes;
  //   }

  //   return quotes.map((quote) => {
  //     const provider = estafetaService.providers.find(
  //       (p) => p.name === "Estafeta"
  //     );
  //     if (provider) {
  //       const service = provider.services.find(
  //         (s) => s.idServicio === quote.idServicio
  //       );
  //       if (service) {
  //         const percentage = service.percentage / 100 + 1;
  //         quote.precio_regular = quote.precio;
  //         quote.precio = (parseFloat(quote.precio) * percentage).toFixed(2);
  //       }
  //     }
  //     return quote;
  //   });
  // }

  async applyPercentagesToQuote(quotes) {
    const estafetaService = await Service.findOne({ name: "Estafeta" });

    if (!estafetaService) {
      console.warn("No se encontraron porcentajes para Estafeta");
      return quotes;
    }

    return quotes.map((quote) => {
      // First, find the provider (in this case, there's only one Estafeta provider)
      const provider = estafetaService.providers[0];

      // Then find the service by idServicio
      const service = provider.services.find(
        (s) => s.idServicio === quote.idServicio
      );

      if (!service) {
        quote.status = false;
        return quote;
      }

        console.log("quote.precio:", quote.precio);
      
      const precio_guia = quote.precio / 0.95;
      const precio_venta = precio_guia / (1 - service.percentage / 100);

      const utilidad = precio_venta - precio_guia;
      const utilidad_dagpacket = utilidad * 0.3;
      const precio_guia_lic = precio_guia + utilidad_dagpacket;

      console.log("precio_guia", precio_guia.toFixed(2));
      console.log("precio_venta", precio_venta.toFixed(2));
      console.log("utilidad", utilidad.toFixed(2));
      console.log("utilidad_dagpacket", utilidad_dagpacket.toFixed(2));
      console.log("precio_guia_lic", precio_guia_lic.toFixed(2));

      quote.precio = precio_venta.toFixed(2);
      quote.precio_regular = precio_guia_lic.toFixed(2);

      return {
        ...quote,
        precio_guia: precio_guia.toFixed(2),
        status: service.status,
      };
    });
  }

  isTokenExpired() {
    return !this.tokenExpiration || new Date().getTime() > this.tokenExpiration;
  }

  async createShipment(shipmentDetails) {
    try {
      await this.ensureValidTokenLabel();

      if (!this.accessTokenLabel) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      const requestBody = this.buildShipmentRequestBody(shipmentDetails);
      console.log("Request body de guia:", requestBody);

      const response = await axios.post(this.labelUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessTokenLabel}`,
          apiKey: this.apiKeyLabel,
        },
      });

      console.log("Respuesta de Estafeta Label API:", response.data);

      return response.data;
    } catch (err) {
      //   console.error("Error en Estafeta Label API:", err);
      if (err.response) {
        console.error(
          "Datos de respuesta de error:",
          JSON.stringify(err.response.data)
        );
        console.error("Estado de respuesta de error:", err.response.status);
        // console.error("Cabeceras de respuesta de error:", JSON.stringify(err.response.headers));
        console.error("ApiKey error:", this.apiKey);
      } else if (err.request) {
        console.error(
          "No se recibió respuesta. Detalles de la solicitud:",
          JSON.stringify(err.request)
        );
      }

      throw new Error(
        "Error al obtener las cotizaciones de Estafeta: " + err.message
      );
    }
  }

  async generateGuide(trackingNumber) {
    try {
      const url = this.labelUrl.replace("05167890591", trackingNumber);
      const response = await axios.get(url, {
        responseType: "arraybuffer",
      });

      return response.data;
    } catch (err) {
      console.error("Error al obtener la guía de Estafeta:", err);
      throw new Error("Error al obtener la guía de Estafeta: " + err.message);
    }
  }

  buildShipmentRequestBody(shipmentDetails) {
    console.log(
      "Datos de envío para Estafeta en buildShipmentRequestBody:",
      shipmentDetails
    );
    const shipDate = new Date();
    const shipDatestamp = shipDate.toISOString().split("T")[0];
    const effectiveDate = shipDatestamp.replace(/-/g, ""); // "20241120"
    //console.log("shipDatestamp:", shipDatestamp);
    return {
      identification: {
        suscriberId: "10",
        customerNumber: this.customerId,
      },
      systemInformation: {
        id: "70",
        name: "Dagpacket",
        version: "1.0",
      },
      labelDefinition: {
        wayBillDocument: {
          content: "Contenido del envío",
        },
        itemDescription: this.buildPackageDetails(shipmentDetails),
        serviceConfiguration: {
          quantityOfLabels: 1,
          serviceTypeId: shipmentDetails.package.service_id,
          salesOrganization: this.salesId,
          originZipCodeForRouting: shipmentDetails.from.zip_code,
          isInsurance: shipmentDetails.package.insurance > 0 ? true : false,
          isReturnDocument: false,
          insurance: {
            contentDescription: shipmentDetails.items[0].descripcion_producto,
            declaredValue: shipmentDetails.items[0].valor_producto,
          },
        },
        location: {
          origin: {
            contact: {
              corporateName: "DagPacket",
              contactName: shipmentDetails.from.name,
              cellPhone: shipmentDetails.from.phone,
              email: "direcccionti@dagpacket.com.mx",
            },
            address: this.buildPartyDetails(shipmentDetails.from),
          },
          destination: {
            isDeliveryToPUDO: false,
            homeAddress: {
              contact: {
                corporateName: "DagPacket",
                contactName: shipmentDetails.to.name,
                cellPhone: shipmentDetails.to.phone,
                email: "luis.godezg@estafeta.com",
              },
              address: this.buildPartyDetails(shipmentDetails.to),
            },
          },
        },
      },
    };
  }

  async buildQuoteRequestBody(shipmentDetails) {
    console.log(
      "Datos de envío para Estafeta en buildQuoteRequestBody :",
      shipmentDetails
    );
    return {
      Origin: shipmentDetails.cp_origen,
      Destination: [shipmentDetails.cp_destino],
      PackagingType: "Paquete",
      IsInsurance: shipmentDetails.seguro > 0 ? true : false,
      ItemValue: shipmentDetails.valor_declarado,
      Dimensions: {
        Length: shipmentDetails.largo,
        Width: shipmentDetails.ancho,
        Height: shipmentDetails.alto,
        Weight: shipmentDetails.peso,
      },
    };
  }

  buildPartyDetails(party) {
    console.log("Datos de envío para Estafeta en buildPartyDetails:", party);

    // Mapeo de códigos ISO 2 a ISO 3 basado en ISO 3166-1
    const isoConversionMap = {
      AF: "AFG",
      AL: "ALB",
      DZ: "DZA",
      AS: "ASM",
      AD: "AND",
      AO: "AGO",
      AI: "AIA",
      AQ: "ATA",
      AG: "ATG",
      AR: "ARG",
      AM: "ARM",
      AW: "ABW",
      AU: "AUS",
      AT: "AUT",
      AZ: "AZE",
      BS: "BHS",
      BH: "BHR",
      BD: "BGD",
      BB: "BRB",
      BY: "BLR",
      BE: "BEL",
      BZ: "BLZ",
      BJ: "BEN",
      BM: "BMU",
      BT: "BTN",
      BO: "BOL",
      BA: "BIH",
      BW: "BWA",
      BV: "BVT",
      BR: "BRA",
      IO: "IOT",
      BN: "BRN",
      BG: "BGR",
      BF: "BFA",
      BI: "BDI",
      KH: "KHM",
      CM: "CMR",
      CA: "CAN",
      CV: "CPV",
      KY: "CYM",
      CF: "CAF",
      TD: "TCD",
      CL: "CHL",
      CN: "CHN",
      CX: "CXR",
      CC: "CCK",
      CO: "COL",
      KM: "COM",
      CG: "COG",
      CD: "COD",
      CK: "COK",
      CR: "CRI",
      CI: "CIV",
      HR: "HRV",
      CU: "CUB",
      CY: "CYP",
      CZ: "CZE",
      DK: "DNK",
      DJ: "DJI",
      DM: "DMA",
      DO: "DOM",
      EC: "ECU",
      EG: "EGY",
      SV: "SLV",
      GQ: "GNQ",
      ER: "ERI",
      EE: "EST",
      ET: "ETH",
      FK: "FLK",
      FO: "FRO",
      FJ: "FJI",
      FI: "FIN",
      FR: "FRA",
      GF: "GUF",
      PF: "PYF",
      TF: "ATF",
      GA: "GAB",
      GM: "GMB",
      GE: "GEO",
      DE: "DEU",
      GH: "GHA",
      GI: "GIB",
      GR: "GRC",
      GL: "GRL",
      GD: "GRD",
      GP: "GLP",
      GU: "GUM",
      GT: "GTM",
      GG: "GGY",
      GN: "GIN",
      GW: "GNB",
      GY: "GUY",
      HT: "HTI",
      HM: "HMD",
      VA: "VAT",
      HN: "HND",
      HK: "HKG",
      HU: "HUN",
      IS: "ISL",
      IN: "IND",
      ID: "IDN",
      IR: "IRN",
      IQ: "IRQ",
      IE: "IRL",
      IM: "IMN",
      IL: "ISR",
      IT: "ITA",
      JM: "JAM",
      JP: "JPN",
      JE: "JEY",
      JO: "JOR",
      KZ: "KAZ",
      KE: "KEN",
      KI: "KIR",
      KP: "PRK",
      KR: "KOR",
      KW: "KWT",
      KG: "KGZ",
      LA: "LAO",
      LV: "LVA",
      LB: "LBN",
      LS: "LSO",
      LR: "LBR",
      LY: "LBY",
      LI: "LIE",
      LT: "LTU",
      LU: "LUX",
      MO: "MAC",
      MG: "MDG",
      MW: "MWI",
      MY: "MYS",
      MV: "MDV",
      ML: "MLI",
      MT: "MLT",
      MH: "MHL",
      MQ: "MTQ",
      MR: "MRT",
      MU: "MUS",
      YT: "MYT",
      MX: "MEX",
      FM: "FSM",
      MD: "MDA",
      MC: "MCO",
      MN: "MNG",
      ME: "MNE",
      MS: "MSR",
      MA: "MAR",
      MZ: "MOZ",
      MM: "MMR",
      NA: "NAM",
      NR: "NRU",
      NP: "NPL",
      NL: "NLD",
      NC: "NCL",
      NZ: "NZL",
      NI: "NIC",
      NE: "NER",
      NG: "NGA",
      NU: "NIU",
      NF: "NFK",
      MK: "MKD",
      MP: "MNP",
      NO: "NOR",
      OM: "OMN",
      PK: "PAK",
      PW: "PLW",
      PS: "PSE",
      PA: "PAN",
      PG: "PNG",
      PY: "PRY",
      PE: "PER",
      PH: "PHL",
      PN: "PCN",
      PL: "POL",
      PT: "PRT",
      PR: "PRI",
      QA: "QAT",
      RE: "REU",
      RO: "ROU",
      RU: "RUS",
      RW: "RWA",
      BL: "BLM",
      SH: "SHN",
      KN: "KNA",
      LC: "LCA",
      MF: "MAF",
      PM: "SPM",
      VC: "VCT",
      WS: "WSM",
      SM: "SMR",
      ST: "STP",
      SA: "SAU",
      SN: "SEN",
      RS: "SRB",
      SC: "SYC",
      SL: "SLE",
      SG: "SGP",
      SX: "SXM",
      SK: "SVK",
      SI: "SVN",
      SB: "SLB",
      SO: "SOM",
      ZA: "ZAF",
      GS: "SGS",
      SS: "SSD",
      ES: "ESP",
      LK: "LKA",
      SD: "SDN",
      SR: "SUR",
      SJ: "SJM",
      SE: "SWE",
      CH: "CHE",
      SY: "SYR",
      TW: "TWN",
      TJ: "TJK",
      TZ: "TZA",
      TH: "THA",
      TL: "TLS",
      TG: "TGO",
      TK: "TKL",
      TO: "TON",
      TT: "TTO",
      TN: "TUN",
      TR: "TUR",
      TM: "TKM",
      TC: "TCA",
      TV: "TUV",
      UG: "UGA",
      UA: "UKR",
      AE: "ARE",
      GB: "GBR",
      US: "USA",
      UM: "UMI",
      UY: "URY",
      UZ: "UZB",
      VU: "VUT",
      VE: "VEN",
      VN: "VNM",
      VG: "VGB",
      VI: "VIR",
      WF: "WLF",
      EH: "ESH",
      YE: "YEM",
      ZM: "ZMB",
      ZW: "ZWE",
    };

    // Obtener el código ISO de 3 caracteres, o usar el original si no está en el mapa
    const isoCountryCode = isoConversionMap[party.iso_pais] || party.iso_pais;

    return {
      bUsedCode: false,
      roadName: party.street,
      roadTypeAbbName: "string",
      externalNum: party.external_number,
      settlementName: party.settlement,
      settlementTypeAbbName: "string",
      zipCode: party.zip_code,
      countryName: isoCountryCode,
    };
  }

  buildPackageDetails(shipmentDetails) {
    // console.log("Datos de envío para Estafeta en BuildPackageDetails:", shipmentDetails)
    console.log(
      "shipmentDetails.items[0].peso_producto:",
      shipmentDetails.items[0].peso_producto
    );
    let tipoPaquete;
    let peso;

    if (shipmentDetails.items[0].peso_producto === "Sobre") {
      tipoPaquete = 1;
    } else {
      tipoPaquete = 4;
    }

    if (shipmentDetails.items[0].peso_producto < 1) {
      peso = 0.1;
    } else {
      peso = shipmentDetails.items[0].peso_producto;
    }

    return {
      parcelId: tipoPaquete,
      weight: peso,
      height: shipmentDetails.items[0].alto_producto,
      length: shipmentDetails.items[0].largo_producto,
      width: shipmentDetails.items[0].ancho_producto,
    };
  }
}

module.exports = new EstafetaService();
