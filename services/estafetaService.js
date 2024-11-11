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
    this.customerId = config.estafeta.customerId;
    this.salesId = config.estafeta.salesId;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      console.log("Token inválido o expirado. Refrescando token...");
      await this.refreshToken();
    }
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

      console.log("headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        apiKey: this.apiKey,
        Customer: this.customerId,
        Sales_organization: this.salesId,
      });

      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          apiKey: this.apiKey,
          Customer: this.customerId,
          Sales_organization: this.salesId,
        },
      });

      // console.log("Respuesta de Estafeta Quote API:", response.data.Service);

      let mappedResponse = mapEstafetaResponse(response.data, shipmentDetails);

      mappedResponse = await this.applyPercentagesToQuote(mappedResponse);

      return {
        paqueterias: mappedResponse,
      };
    } catch (err) {
      console.error("Error en Estafeta Quote API:", err);
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

  async createShipment(shipmentDetails) {
    try{
      await this.ensureValidToken();
      if (!this.accessToken) {
        throw new Error("No se pudo obtener el token de acceso");
      }

      
      const requestBody =  this.buildShipmentRequestBody(shipmentDetails);

      const response = await axios.post(this.labelUrl, requestBody);

      console.log("Respuesta de Estafeta Label API:", response.data);

      return response.data;

 
    }catch(err){
      console.error("Error en Estafeta Label API:", err);
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

  async buildQuoteRequestBody(shipmentDetails) {
    console.log("Datos de envío para Estafeta:", shipmentDetails);
    return {
      Origin: shipmentDetails.cp_origen,
      Destination: [shipmentDetails.cp_destino],
      PackagingType: "Paquete",
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

  buildPartyDetails(party) {
    return {
      bUsedCode: true,
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
      zipCode: party.zipCode,
      countryCode: "",
      countryName: "MEX",
      addressReference: "",
      betweenRoadName1: "",
      betweenRoadName2: "",
      latitude: "",
      longitude: "",
      externalNum: party.externalNum,
      indoorInformation: "2",
      nave: "",
      platform: "",
      localityCode: "",
      localityName: party.city,
    };
  }

  buildPackageDetails(shipmentDetails) {
    let tipoPaquete;
    let peso;

    if (shipmentDetails.shipment_type === "Sobre") {
      tipoPaquete = 1;
    } else {
      tipoPaquete = 4;
    }

    if (shipmentDetails.shipment_data.package_weight < 1) {
      peso = 0.1;
    } else {
      peso = shipmentDetails.shipment_data.package_weight;
    }

    return {
      parcelId: tipoPaquete,
      weight: peso,
      height: shipmentDetails.shipment_data.height,
      length: shipmentDetails.shipment_data.length,
      width: shipmentDetails.shipment_data.width,
      merchandises: {
        totalGrossWeight: shipmentDetails.shipment_data.volumetric_weight,
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

  buildShipmentRequestBody(shipmentDetails) {
    const shipDate = new Date();
    const shipDatestamp = shipDate.toISOString().split("T")[0];
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
        itemDescription: buildPackageDetails(shipmentDetails),
        serviceConfiguration: {
          quantityOfLabels: 1,
          serviceTypeId: shipmentDetails.idServicio,
          salesOrganization: this.salesId,
          effectiveDate: shipDatestamp,
          originZipCodeForRouting: shipmentDetails.origin_cp,
          isInsurance: shipmentDetails.insurance > 0 ? true : false,
          insurance: {
            contentDescription: "Shipment contents",
            declaredValue: shipmentDetails.insurance,
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
              bUsedCode: true,
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
              localityCode: "02",
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
            address: buildPartyDetails(shipmentDetails.from),
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
              address: buildPartyDetails(shipmentDetails.to),
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
              address: buildPartyDetails(shipmentDetails.to),
            },
          },
        },
      },
    };
  }
}

module.exports = new EstafetaService();
