// utils/paqueteExpressMapper.js

// utils/paqueteExpressMapper.js

const mapPaqueteExpressResponse = (paqueteExpressResponse, inputData) => {

  // console.log('Respuesta de Paquete Express:', JSON.stringify(paqueteExpressResponse, null, 2));
    if (!paqueteExpressResponse || !paqueteExpressResponse.body || !paqueteExpressResponse.body.response || !paqueteExpressResponse.body.response.data || !paqueteExpressResponse.body.response.data.quotations) {
      // console.log('La respuesta de Paquete Express no contiene la estructura esperada:', JSON.stringify(paqueteExpressResponse));
      return [];
    }
  
    return paqueteExpressResponse.body.response.data.quotations.map(quote => {
      return {
        idServicio: quote.id || 'N/A',
        logo: "https://superenvios.mx/api/images/servicios/carritofinalPaqueteExpress_2023.png",
        proveedor: "Paquete Express",
        nombre_servicio: quote.serviceName || 'Servicio desconocido',
        tiempo_de_entrega: quote.serviceInfoDescr || 'Consultar tiempo de entrega',
        precio_regular: quote.amount.totalAmnt.toFixed(2),
        zona_extendida: "FALSE",
        precio_zona_extendida: "0.00",
        precio: quote.amount.totalAmnt.toFixed(2),
        kilos_a_cobrar: inputData.peso.toString(),
        tipo_cotizacion: "API Paquete Express",
        zona: paqueteExpressResponse.body.response.data.clientAddrDest.zone || "N/A",
        cobertura_especial: "FALSE",
        precio_api:quote.amount.totalAmnt.toFixed(2)
      };
    });
  };    
  
  const estimarTiempoEntrega = (serviceId) => {
    switch(serviceId) {
      case 'EXPRESS':
        return "(1 DÍA HÁBIL)";
      case 'ECOEXPRESS':
        return "(2 A 3 DÍAS HÁBILES)";
      default:
        return "Consultar tiempo de entrega";
    }
  };
  
  const mapToPaqueteExpressFormat = (standardShipment) => {
    if (!standardShipment || !standardShipment.cp_origen || !standardShipment.cp_destino) {
      throw new Error('Datos de envío incompletos');
    }
  
    return {
      header: {
        security: {
          user: process.env.PAQUETE_EXPRESS_USER,
          password: process.env.PAQUETE_EXPRESS_PASSWORD,
          type: 1,
          token: process.env.PAQUETE_EXPRESS_TOKEN
        },
        device: {
          appName: "Customer",
          type: "Web",
          ip: "",
          idDevice: ""
        },
        target: {
          module: "QUOTER",
          version: "1.0",
          service: "quoter",
          uri: "quotes",
          event: "R"
        },
        output: "JSON",
        language: null
      },
      body: {
        request: {
          data: {
            clientAddrOrig: {
              zipCode: standardShipment.cp_origen,
              colonyName: standardShipment.colonia_origen || "COLONIA"
            },
            clientAddrDest: {
              zipCode: standardShipment.cp_destino,
              colonyName: standardShipment.colonia_destino || "COLONIA"
            },
            services: {
              dlvyType: "1",
              ackType: "N",
              totlDeclVlue: standardShipment.valor_declarado,
              invType: "A",
              radType: "1"
            },
            otherServices: {
              otherServices: []
            },
            shipmentDetail: {
              shipments: [
                {
                  sequence: 1,
                  quantity: 1,
                  shpCode: "2",
                  weight: standardShipment.peso,
                  longShip: standardShipment.largo,
                  widthShip: standardShipment.ancho,
                  highShip: standardShipment.alto
                }
              ]
            },
            quoteServices: [
              "ALL"
            ]
          },
          objectDTO: null
        },
        response: null
      }
    };
  };

const mapToPaqueteExpressShipmentFormat = (shipmentData, user, password, token) => {
    const getEmail = (person) => {
        if (person.email) return person.email;
        // Generar un email temporal basado en el nombre y un dominio ficticio
        return `${person.name.replace(/\s+/g, '.').toLowerCase()}@example.com`;
      };
  return {
    header: {
      security: {
        user: user,
        password: password,
        type: 0,
        token: token
      },
      device: {
        appName: "Customer",
        type: null,
        ip: "barracuda",
        idDevice: null
      },
      target: null,
      output: null,
      language: null
    },
    body: {
      request: {
        data: [
          {
            billRad: "REQUEST",
            billClntId: "22096088", // Esto podría ser configurable
            pymtMode: "PAID",
            pymtType: "C",
            comt: shipmentData.package.content,
            radGuiaAddrDTOList: [
              {
                addrLin1: "MEXICO",
                addrLin3: shipmentData.from.iso_estado,
                addrLin4: shipmentData.from.city,
                addrLin5: shipmentData.from.city,
                addrLin6: shipmentData.from.settlement,
                zipCode: shipmentData.from.zip_code,
                strtName: shipmentData.from.street,
                drnr: shipmentData.from.external_number,
                phno1: shipmentData.from.phone,
                clntName: shipmentData.from.name,
                email: getEmail(shipmentData.from),
                contacto: shipmentData.from.name,
                addrType: "ORIGIN"
              },
              {
                addrLin1: "MEXICO",
                addrLin3: shipmentData.to.iso_estado,
                addrLin4: shipmentData.to.city,
                addrLin5: shipmentData.to.city,
                addrLin6: shipmentData.to.settlement,
                zipCode: shipmentData.to.zip_code,
                strtName: shipmentData.to.street,
                drnr: shipmentData.to.external_number,
                phno1: shipmentData.to.phone,
                clntName: shipmentData.to.name,
                email: getEmail(shipmentData.from),
                contacto: shipmentData.to.name,
                addrType: "DESTINATION"
              }
            ],
            radSrvcItemDTOList: [
              {
                srvcId: "PACKETS",
                productIdSAT: shipmentData.items[0].clave_producto,
                weight: shipmentData.package.weight.toString(),
                volL: shipmentData.package.length.toString(),
                volW: shipmentData.package.width.toString(),
                volH: shipmentData.package.height.toString(),
                cont: shipmentData.package.content,
                qunt: "1"
              }
            ],
            listSrvcItemDTO: [
              {
                srvcId: "EAD",
                value1: ""
              },
              {
                srvcId: "RAD",
                value1: ""
              }
            ],
            typeSrvcId: shipmentData.package.service_id,
            listRefs: [
              {
                grGuiaRefr: shipmentData.package.content
              }
            ]
          }
        ],
        objectDTO: null
      },
      response: null
    }
  };
};
  
  const mapPaqueteExpressGuideResponse = (createShipmentResponse, guideBuffer) => {
    return {
      success: true,
      message: "Guía generada exitosamente",
      data: {
        provider: "paqueteexpress",
        guideNumber: createShipmentResponse.data,
        guideUrl: "", // Aquí podrías guardar el PDF y devolver una URL
        trackingUrl: `https://www.paquetexpress.com.mx/rastreo/${createShipmentResponse.data}`,
        labelType: "PDF",
        additionalInfo: {
          folioLetterPorte: createShipmentResponse.objectDTO,
          creditAmnt: createShipmentResponse.additionalData.creditAmnt,
          subTotlAmnt: createShipmentResponse.additionalData.subTotlAmnt,
          totalAmnt: createShipmentResponse.additionalData.totalAmnt
        }
      },
      pdfBuffer: Buffer.from(guideBuffer, "base64")
    };
  };

  const mapPaqueteExpressTrackingResponse = (paqueteExpressResponse) => {
    // Validate input data
    if (!paqueteExpressResponse || !paqueteExpressResponse.data || paqueteExpressResponse.data.length === 0) {
      return {
        success: false,
        message: "No se encontró información de rastreo",
        data: null
      };
    }
  
    // Take the first tracking entry (most recent)
    const trackingEntry = paqueteExpressResponse.data[0];
  
    return {
      success: true,
      message: "Tracking exitoso",
      paqueteria: "Paquete Express",
      data: {
        fecha: trackingEntry.fecha || 'No disponible',
        hora: trackingEntry.hora || 'No disponible',
        sucursal: trackingEntry.sucursal || 'No especificada',
        destino: trackingEntry.ciudadDestino || 'No especificado',
        origen: trackingEntry.ciudadEvento || 'No especificado',
        guia: trackingEntry.guia || 'Sin información',
        rastreo: trackingEntry.rastreo || 'Sin número de rastreo',
        status: trackingEntry.status || 'Estado desconocido'
      }
    };
  };
  
  module.exports = {
    mapPaqueteExpressResponse,
    mapToPaqueteExpressFormat,
    mapToPaqueteExpressShipmentFormat,
    mapPaqueteExpressGuideResponse,
    mapPaqueteExpressTrackingResponse
  };