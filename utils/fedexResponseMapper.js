const mapFedExResponse = (fedexResponse, inputData) => {
    if (!fedexResponse.output || !fedexResponse.output.rateReplyDetails) {
      console.log('La respuesta de FedEx no contiene rateReplyDetails');
      return [];
    }
  
    return fedexResponse.output.rateReplyDetails.map(service => {        
      // Tomamos el primer rateDetail disponible
      const rateDetail = service.ratedShipmentDetails[0];
  
      if (!rateDetail) {
        console.log('No se encontró un rateDetail para', service.serviceType);
        return null;
      }
  
      return {
        idServicio: service.serviceType,
        logo: "https://superenvios.mx/api/images/servicios/carritofinalfedex_2023.png",
        proveedor: "Fedex",
        nombre_servicio: service.serviceName,
        tiempo_de_entrega: estimarTiempoEntrega(service.serviceType),
        precio_regular: rateDetail.totalBaseCharge.toFixed(2),
        zona_extendida: "FALSE",
        precio_zona_extendida: "0.00",
        precio: rateDetail.totalNetCharge.toFixed(2),
        kilos_a_cobrar: inputData.peso.toString(),
        tipo_cotizacion: "API FedEx",
        zona: rateDetail.shipmentRateDetail.rateZone || "N/A",
        cobertura_especial: "FALSE"
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
  
  module.exports = {mapFedExResponse, mapToFedExFormat};