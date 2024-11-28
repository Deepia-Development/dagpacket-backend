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
    this.accessTokenLabel = null;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      console.log("Token inválido o expirado. Refrescando token...");
      await this.refreshToken();
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
  };

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
      console.log('URL:', this.apiUrl);
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          apiKey: this.apiKey
         
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
   
      const precio_guia = quote.precio / 0.95;
      const precio_venta = precio_guia / (1 - service.percentage / 100);
   
      const utilidad = precio_venta - precio_guia;
      const utilidad_dagpacket = utilidad * 0.3; 
      const precio_guia_lic = precio_guia + utilidad_dagpacket;


      console.log('precio_guia', precio_guia.toFixed(2));
      console.log('precio_venta', precio_venta.toFixed(2));
      console.log('utilidad', utilidad.toFixed(2));
      console.log('utilidad_dagpacket', utilidad_dagpacket.toFixed(2));
      console.log('precio_guia_lic', precio_guia_lic.toFixed(2));
   
      quote.precio = precio_venta.toFixed(2);
      quote.precio_regular = precio_guia_lic.toFixed(2);
      
      return {
        ...quote,
        precio_guia: precio_guia.toFixed(2),
        status: service.status
      };
    });
   }

  isTokenExpired() {
    return !this.tokenExpiration || new Date().getTime() > this.tokenExpiration;
  }

  async createShipment(shipmentDetails) {
    try{
  
      await this.ensureValidTokenLabel();

      if (!this.accessTokenLabel) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      
      const requestBody =  this.buildShipmentRequestBody(shipmentDetails);

      const response = await axios.post(this.labelUrl, requestBody,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessTokenLabel}`,
          apiKey: this.apiKeyLabel,
        },
      });

      console.log("Respuesta de Estafeta Label API:", response.data);

      return response.data;

 
    }catch(err){
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

 
  buildShipmentRequestBody(shipmentDetails) {
  //  console.log("Datos de envío para Estafeta en buildShipmentRequestBody:", shipmentDetails);
    const shipDate = new Date();
    const shipDatestamp = shipDate.toISOString().split("T")[0];
    const effectiveDate = shipDatestamp.replace(/-/g, ""); // "20241120"
    //console.log("shipDatestamp:", shipDatestamp);
    return {
      identification: {
        suscriberId: "01",
        customerNumber: this.customerId,
      },
      systemInformation: {
        id: "AP01",
        name: "AP01",
        version: "1.10.20",
      },
      labelDefinition: {
        wayBillDocument: {
          aditionalInfo: "string",
          content: "Documents",
          costCenter: "SPMXA12345",
          customerShipmentId: null,
          referenceNumber: "Ref1",
          groupShipmentId: null,
        },
        itemDescription: this.buildPackageDetails(shipmentDetails),
        serviceConfiguration: {
          quantityOfLabels: 1,
          serviceTypeId: shipmentDetails.package.service_id,
          salesOrganization: this.salesId,
          effectiveDate: effectiveDate,
          originZipCodeForRouting: shipmentDetails.from.zip_code,
          isInsurance: shipmentDetails.package.insurance > 0 ? true : false,
          insurance: {
            contentDescription: shipmentDetails.items[0].descripcion_producto,
            declaredValue: shipmentDetails.items[0].valor_producto,
          },
          isReturnDocument: false,
          returnDocument: {
            type: "DRFZ",
            serviceId: "60",
          },
        },
        location: {
          isDRAAlternative: false,
          DRAAlternative: {
            contact: {
              corporateName: "Estafeta Mexicana SA de CV",
              contactName: "Luis Godinez",
              cellPhone: "7771798529",
              telephone: "7771011300",
              phoneExt: "119",
              email: "luis.godezg@estafeta.com",
              taxPayerCode: "AOPB010102ROA",
            },
            address: {
              bUsedCode: false,
              roadTypeCode: "001",
              roadTypeAbbName: "string",
              roadName: "Domingo Diez",
              townshipCode: "08-019",
              townshipName: "string",
              settlementTypeCode: "001",
              settlementTypeAbbName: "string",
              settlementName: "El Empleado",
              stateCode: "02",
              stateAbbName: "Monterrey",
              zipCode: "62250",
              countryCode: "484",
              countryName: "MEX",
              addressReference: "Junta a Farmacia",
              betweenRoadName1: "La Morelos",
              betweenRoadName2: "Los Estrada",
              latitude: "-99.12",
              longitude: "19.48",
              externalNum: "1014",
              indoorInformation: "2",
              nave: "NA999",
              platform: "P199",
              localityCode: "00",
              localityName: "Cozumel",
            },
          },
          origin: {
            contact: {
              corporateName: "Estafeta Mexicana SA de CV",
              contactName: "Luis Godinez",
              cellPhone: "7771798529",
              telephone: "7771011300",
              phoneExt: "119",
              email: "luis.godezg@estafeta.com",
              taxPayerCode: "AOPB010102ROA",
            },
            address: this.buildPartyDetails(shipmentDetails.from),
          },
          destination: {
            isDeliveryToPUDO: false,
            deliveryPUDOCode: "567",
            homeAddress: {
              contact: {
                corporateName: "Estafeta Mexicana SA de CV",
                contactName: "Luis Godinez",
                cellPhone: "7771798529",
                telephone: "7771011300",
                phoneExt: "119",
                email: "luis.godezg@estafeta.com",
                taxPayerCode: "AOPB010102ROA",
              },
              address: this.buildPartyDetails(shipmentDetails.to),
            },
          },
          notified: {
            notifiedTaxIdCode: "notifiedTaxCode",
            notifiedTaxCountry: "MEX",
            residence: {
              contact: {
                corporateName: "Estafeta Mexicana SA de CV",
                contactName: "Luis Godinez",
                cellPhone: "7771798529",
                telephone: "7771011300",
                phoneExt: "119",
                email: "luis.godezg@estafeta.com",
                taxPayerCode: "AOPB010102ROA",
              },
              address: this.buildPartyDetails(shipmentDetails.to),
            },
          },
        },
      },
    };
  }

  async buildQuoteRequestBody(shipmentDetails) {
    console.log("Datos de envío para Estafeta en buildQuoteRequestBody :", shipmentDetails);
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
   // console.log("Datos de envío para Estafeta en buildPartyDetails:", party)
    return {
      bUsedCode: false,
      roadTypeCode: "001",
      roadTypeAbbName: "string",
      roadName: party.street,
      townshipCode: "08-019",
      townshipName: "string",
      settlementTypeCode: "001",
      settlementTypeAbbName: "string",
      settlementName: party.settlement,
      stateCode: "",
      stateAbbName: party.state,
      zipCode: party.zip_code,
      countryCode: party.iso_estado,
      countryName: "MEX",
      addressReference: "",
      betweenRoadName1: "",
      betweenRoadName2: "",
      latitude: "",
      longitude: "",
      externalNum: party.external_number,
      indoorInformation: "2",
      nave: "",
      platform: "",
      localityCode: party.locality_key,
      localityName: party.city,
    };
  }

  buildPackageDetails(shipmentDetails) {
    // console.log("Datos de envío para Estafeta en BuildPackageDetails:", shipmentDetails)
    console.log("shipmentDetails.items[0].peso_producto:", shipmentDetails.items[0].peso_producto)
    let tipoPaquete;
    let peso;

    if (shipmentDetails.items[0].peso_producto === "Sobre") {
      tipoPaquete = 1;
    } else {
      tipoPaquete = 4;
    }

    if ( shipmentDetails.items[0].peso_producto < 1) {
      peso = 0.1;
    } else {
      peso =  shipmentDetails.items[0].peso_producto;
    }

    return {
      parcelId: tipoPaquete,
      weight: peso,
      height: shipmentDetails.items[0].alto_producto,
      length: shipmentDetails.items[0].largo_producto,
      width: shipmentDetails.items[0].ancho_producto,
      merchandises: {
        totalGrossWeight: shipmentDetails.peso,
        weightUnitCode: "XLU",
        merchandise: [
          {
            merchandiseValue: shipmentDetails.insurance,
            currency: "MXN",
            productServiceCode: "10131508",
            merchandiseQuantity: 1,
            measurementUnitCode: "F63",
            tariffFraction: "12345678",
            UUIDExteriorTrade: "ABCDed02-a12A-B34B-c56C-c5abcdef61F2",
            isInternational: false,
            isImport: false,
            isHazardousMaterial: false,
            hazardousMaterialCode: "M0035",
            packagingCode: "4A",
          },
        ],
      },
    };
  }

}

module.exports = new EstafetaService();
