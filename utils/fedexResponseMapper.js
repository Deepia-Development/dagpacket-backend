const mapFedExResponse = (fedexResponse, inputData) => {

   //console.log('Mapeando respuesta de FedEx:', JSON.stringify(fedexResponse, null, 2));

  if (!fedexResponse || !fedexResponse.output || !Array.isArray(fedexResponse.output.rateReplyDetails) || fedexResponse.output.rateReplyDetails.length === 0) {
    console.log('The FedEx response does not contain valid rateReplyDetails');
    return [];
  }

  return fedexResponse.output.rateReplyDetails.map(service => {
    if (!service.ratedShipmentDetails || !Array.isArray(service.ratedShipmentDetails) || service.ratedShipmentDetails.length === 0) {
      console.log(`No ratedShipmentDetails found for service type: ${service.serviceType}`);
      return null;
    }

    const ratedShipment = service.ratedShipmentDetails[0];
    if (!ratedShipment) {
      console.log(`No ratedShipmentDetails available in the first element for service type: ${service.serviceType}`);
      return null;
    }
    

    return {
      idServicio: service.serviceType,
      logo: "https://superenvios.mx/api/images/servicios/carritofinalfedex_2023.png",
      proveedor: "Fedex",
      nombre_servicio: service.serviceName || "N/A",
      tiempo_de_entrega: estimarTiempoEntrega(service.serviceType),
      precio_regular: ratedShipment.totalBaseCharge ? ratedShipment.totalBaseCharge.toFixed(2) : "0.00",
      zona_extendida: "FALSE",
      precio_zona_extendida: "0.00",
      precio: ratedShipment.totalNetCharge ? ratedShipment.totalNetCharge.toFixed(2) : "0.00",
      kilos_a_cobrar: inputData.peso ? inputData.peso.toString() : "N/A",
      tipo_cotizacion: "API FedEx",
      zona: ratedShipment.shipmentRateDetail ? (ratedShipment.shipmentRateDetail.rateZone || "N/A") : "N/A",
      cobertura_especial: "FALSE",
      precio_api: ratedShipment.totalNetCharge ? ratedShipment.totalNetCharge.toFixed(2) : "0.00",
      precio_api_dolares: ratedShipment.totalNetCharge ? ratedShipment.totalNetCharge.toFixed(2) : "0.00",
    };
  }).filter(quote => quote !== null);
};


  
  const estimarTiempoEntrega = (serviceType) => {
    switch(serviceType) {
      // Servicios domésticos de EE. UU.
      case 'FIRST_OVERNIGHT':
      case 'PRIORITY_OVERNIGHT':
      case 'FEDEX_PRIORITY_OVERNIGHT':
        return "(1 DÍA HÁBIL)";
      case 'STANDARD_OVERNIGHT':
        return "(1 A 3 DÍAS HÁBILES)";
      case 'FEDEX_2_DAY_AM':
      case 'FEDEX_2_DAY':
        return "(2 DÍAS HÁBILES)";
      case 'FEDEX_EXPRESS_SAVER':
        return "(3 DÍAS HÁBILES)";
      case 'FEDEX_GROUND':
      case 'GROUND_HOME_DELIVERY':
        return "(1 A 5 DÍAS HÁBILES)";
      case 'SMART_POST':
        return "(2 A 7 DÍAS HÁBILES)";
      case 'DATE_CERTAIN':
      case 'EVENING':
      case 'APPOINTMENT':
        return "(SEGÚN ACUERDO)";
  
      // Servicios internacionales
      case 'INTERNATIONAL_FIRST':
        return "(1 A 3 DÍAS HÁBILES)";
      case 'INTERNATIONAL_PRIORITY':
      case 'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS':
        return "(1 A 3 DÍAS HÁBILES)";
      case 'FEDEX_10KG_BOX':
      case 'FEDEX_25KG_BOX':
        return "(1 A 3 DÍAS HÁBILES)";
      case 'INTERNATIONAL_ECONOMY':
        return "(2 A 5 DÍAS HÁBILES)";
      case 'FEDEX_INTERNATIONAL_CONNECT_PLUS':
        return "(2 A 5 DÍAS HÁBILES)";
      case 'FEDEX_REGIONAL_ECONOMY':
        return "(1 A 4 DÍAS HÁBILES)";
      case 'FEDEX_REGIONAL_ECONOMY_FREIGHT':
        return "(2 A 5 DÍAS HÁBILES)";
  
      default:
        return "Consultar tiempo de entrega";
    }
  };

  function mapToFedExFormat(standardShipment) {
    return {
      labelResponseOptions: "LABEL",
      requestedShipment: {
        shipper: {
          contact: {
            personName: standardShipment.origen.nombre,
            phoneNumber: standardShipment.origen.telefono,
            companyName: standardShipment.origen.nombre
          },
          address: {
            streetLines: [
              `${standardShipment.origen.calle} ${standardShipment.origen.numero_exterior}`,
              standardShipment.origen.numero_interior,
              standardShipment.origen.colonia
            ].filter(Boolean),
            city: standardShipment.origen.ciudad,
            stateOrProvinceCode: standardShipment.origen.iso_estado,
            postalCode: standardShipment.origen.cp_origen,
            countryCode: standardShipment.origen.iso_pais
          }
        },
        recipients: [
          {
            contact: {
              personName: standardShipment.destino.nombre,
              phoneNumber: standardShipment.destino.telefono,
              companyName: standardShipment.destino.nombre
            },
            address: {
              streetLines: [
                `${standardShipment.destino.calle} ${standardShipment.destino.numero_exterior}`,
                standardShipment.destino.numero_interior,
                standardShipment.destino.colonia
              ].filter(Boolean),
              city: standardShipment.destino.ciudad,
              stateOrProvinceCode: standardShipment.destino.iso_estado,
              postalCode: standardShipment.destino.cp_destino,
              countryCode: standardShipment.destino.iso_pais
            }
          }
        ],
        shipDatestamp: new Date().toISOString().split('T')[0],
        serviceType: mapFedExService(standardShipment.paquete.idServicio),
        packagingType: "YOUR_PACKAGING",
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        shippingChargesPayment: {
          paymentType: "SENDER",
          payor: {
            responsibleParty: {
              accountNumber: {
                value: process.env.FEDEX_ACCOUNT_NUMBER // Asumiendo que tienes el account number en una variable de entorno
              }
            }
          }
        },
        labelSpecification: {
          labelStockType: standardShipment.impresion.tipo_papel,
          imageType: "PNG"
        },
        requestedPackageLineItems: [
          {
            weight: {
              units: "KG",
              value: standardShipment.paquete.peso
            },
            dimensions: {
              length: standardShipment.paquete.largo,
              width: standardShipment.paquete.ancho,
              height: standardShipment.paquete.alto,
              units: "CM"
            },
            customerReferences: [
              {
                customerReferenceType: "CUSTOMER_REFERENCE",
                value: standardShipment.origen.referencia
              }
            ],
            declaredValue: {
              amount: standardShipment.paquete.valor_declarado,
              currency: "MXN"
            }
          }
        ],
        customsClearanceDetail: {
          dutiesPayment: {
            paymentType: "SENDER"
          },
          commodities: standardShipment.items.map(item => ({
            numberOfPieces: parseInt(item.cantidad_producto),
            description: item.descripcion_producto,
            countryOfManufacture: standardShipment.origen.iso_pais,
            weight: {
              units: "KG",
              value: parseFloat(item.peso_producto)
            },
            quantity: parseInt(item.cantidad_producto),
            quantityUnits: item.clave_unidad,
            unitPrice: {
              amount: parseFloat(item.valor_producto),
              currency: "MXN"
            },
            customsValue: {
              amount: parseFloat(item.valor_producto) * parseInt(item.cantidad_producto),
              currency: "MXN"
            }
          }))
        }
      },
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER
      }
    };
  }
  

  const mapFedExResponseTracking = (fedexResponse) => {
    // Check if the required data exists
    if (!fedexResponse || !fedexResponse.trackResults || fedexResponse.trackResults.length === 0) {
      return {
        success: false,
        message: "Información de rastreo no disponible",
        paqueteria: "Fedex",
        data: null
      };
    }
  
    // Get the first track result (assuming single shipment tracking)
    const trackResult = fedexResponse.trackResults[0];
  
    return {
      success: true,
      message: "Tracking Exitoso",
      paqueteria: "Fedex",
      data: {
        rastreo: trackResult.trackingNumberInfo.trackingNumber,
        ultima_actualizacion: {
          status: trackResult.latestStatusDetail.statusByLocale,
          descripcion: trackResult.latestStatusDetail.description,
        },
        eventos: trackResult.scanEvents.map(event => ({
          fecha: event.date,
          descripcion: event.eventDescription,
          lugar: event.scanLocation.streetLines[0] || 'No especificado',
        })),
        origen: {
          ciudad: trackResult.shipperInformation.address.city,
          estado: trackResult.shipperInformation.address.stateOrProvinceCode,
          pais: trackResult.shipperInformation.address.countryName,
        },
        destino: {
          ciudad: trackResult.recipientInformation.address.city,
          estado: trackResult.recipientInformation.address.stateOrProvinceCode,
          pais: trackResult.recipientInformation.address.countryName,
        },
        ultima_modificacion_domicilio: {
          ciudad: trackResult.lastUpdatedDestinationAddress.city,
          estado: trackResult.lastUpdatedDestinationAddress.stateOrProvinceCode,
          pais: trackResult.lastUpdatedDestinationAddress.countryName,
        }
      }
    };
  };
  

  module.exports = {mapFedExResponse, mapToFedExFormat,mapFedExResponseTracking};