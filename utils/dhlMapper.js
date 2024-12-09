const moment = require('moment');

const mapDHLResponse = (dhlResponse, inputData) => {
  if (!dhlResponse || !dhlResponse.products || !Array.isArray(dhlResponse.products)) {
    console.log('La respuesta de DHL no contiene la estructura esperada:', JSON.stringify(dhlResponse));
    return [];
  }

  return dhlResponse.products.map(product => {
    const totalPrice = product.totalPrice.find(price => price.currencyType === 'BILLABLE') || product.totalPrice[0];
    return {
      idServicio: product.productCode || 'N/A',
      logo: "https://superenvios.mx/api/images/servicios/dhl_logo.png",
      proveedor: "DHL",
      nombre_servicio: product.productName || 'Servicio desconocido',
      tiempo_de_entrega: product.deliveryCapabilities?.estimatedDeliveryDateAndTime || 'Consultar tiempo de entrega',
      precio_regular: totalPrice?.price?.toFixed(2) || '0.00',
      zona_extendida: "FALSE",
      precio_zona_extendida: "0.00",
      precio: totalPrice?.price?.toFixed(2) || '0.00',
      kilos_a_cobrar: inputData.peso?.toString() || '0',
      tipo_cotizacion: "API DHL",
      zona: "N/A",
      cobertura_especial: "FALSE",
      precio_api: totalPrice?.price?.toFixed(2) || '0.00'
    };
  });
};

const mapToDHLShipmentFormat = (shipmentData, accountNumber) => {
  const ensureNonEmpty = (str, defaultValue = 'N/A') => str && str.trim() ? str.trim() : defaultValue;
  const getValidProductCode = (code) => {
    if (!code) return 'N';
    return code.length > 3 ? code.substring(0, 3) : code;
  };

  return {
    plannedShippingDateAndTime: new Date().toISOString().replace(/\.\d{3}Z$/, ' GMT-06:00'),
    pickup: { isRequested: false },
    productCode: getValidProductCode(shipmentData.package?.service_id),
    localProductCode: getValidProductCode(shipmentData.package?.service_id),
    getRateEstimates: false,
    accounts: [{ typeCode: 'shipper', number: accountNumber }],
    outputImageProperties: {
      imageOptions: [
        {
          typeCode: "waybillDoc",
          templateName: "ECOM26_84_001",
          isRequested: true,
          hideAccountNumber: false,
          numberOfCopies: 1
        }
      ],
      splitTransportAndWaybillDocLabels: true,
      allDocumentsInOneImage: true,
      splitDocumentsByPages: true,
      splitInvoiceAndReceipt: true
    },
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: shipmentData.from?.zip_code,
          cityName: shipmentData.from?.city,
          countryCode: shipmentData.from?.iso_pais,
          provinceCode: shipmentData.from?.iso_estado,
          addressLine1: ensureNonEmpty(`${shipmentData.from?.street} ${shipmentData.from?.external_number}`),
          addressLine2: ensureNonEmpty(shipmentData.from?.settlement),
          addressLine3: "N/A"
        },
        contactInformation: {
          phone: ensureNonEmpty(shipmentData.from?.phone),
          companyName: ensureNonEmpty(shipmentData.from?.name),
          fullName: ensureNonEmpty(shipmentData.from?.name)
        }
      },
      receiverDetails: {
        postalAddress: {
          postalCode: shipmentData.to?.zip_code,
          cityName: shipmentData.to?.city,
          countryCode: shipmentData.to?.iso_pais,
          provinceCode: shipmentData.to?.iso_estado,
          addressLine1: ensureNonEmpty(`${shipmentData.to?.street} ${shipmentData.to?.external_number}`),
          addressLine2: ensureNonEmpty(shipmentData.to?.settlement),
          addressLine3: "N/A"
        },
        contactInformation: {
          phone: ensureNonEmpty(shipmentData.to?.phone),
          companyName: ensureNonEmpty(shipmentData.to?.name),
          fullName: ensureNonEmpty(shipmentData.to?.name)
        }
      }
    },
    content: {
      packages: [
        {
          weight: shipmentData.package?.weight,
          dimensions: {
            length: shipmentData.package?.length,
            width: shipmentData.package?.width,
            height: shipmentData.package?.height
          },
          customerReferences: [
            { value: ensureNonEmpty(shipmentData.package?.content), typeCode: 'CU' }
          ]
        }
      ],
      isCustomsDeclarable: false,
      description: ensureNonEmpty(shipmentData.package?.content, 'General merchandise'),
      unitOfMeasurement: 'metric',
      incoterm: 'DAP',
      declaredValue: shipmentData.package?.declared_value,
      declaredValueCurrency: 'MXN'
    }
  };
};

const mapDHLTrackingResponse=(dhlResponse) => {
  // Validate input data
  if (!dhlResponse || !dhlResponse.shipments || dhlResponse.shipments.length === 0) {
    return {
      success: false,
      message: "No se encontró información de rastreo",
      paqueteria: "DHL",
      data: null
    };
  }

  const shipment = dhlResponse.shipments[0];

  return {
    success: true,
    message: "Tracking exitoso",
    paqueteria: "DHL",
    data: {
      rastreo: shipment.shipmentTrackingNumber,
      fecha_envio: shipment.shipmentTimestamp ? moment(shipment.shipmentTimestamp).format('YYYY-MM-DD') : 'No disponible',
      status: shipment.status,
      descripcion: shipment.description || 'Sin descripción',
      peso: `${shipment.totalWeight} ${shipment.unitOfMeasurements}`,
      origen: {
        ciudad: shipment.shipperDetails.postalAddress.cityName || 'No especificado',
        pais: shipment.shipperDetails.postalAddress.countryCode || 'No especificado',
        area_servicio: shipment.shipperDetails.serviceArea?.[0]?.description || 'No especificado'
      },
      destino: {
        ciudad: shipment.receiverDetails.postalAddress.cityName || 'No especificado',
        pais: shipment.receiverDetails.postalAddress.countryCode || 'No especificado',
        area_servicio: shipment.receiverDetails.serviceArea?.[0]?.description || 'No especificado',
        codigo_instalacion: shipment.receiverDetails.serviceArea?.[0]?.facilityCode || 'No especificado'
      },
      referencias: shipment.shipperReferences.map(ref => ({
        valor: ref.value,
        tipo: ref.typeCode
      })),
      eventos: shipment.events?.length > 0 
        ? shipment.events.map(event => ({
            fecha: event.date,
            hora: event.time,
            descripcion: event.description,
            lugar: event.location?.address?.city || 'No especificado'
          }))
        : [],
      detalles_adicionales: {
        codigo_producto: shipment.productCode,
        numero_piezas: shipment.numberOfPieces
      }
    }
  };
}

module.exports = {
  mapDHLResponse,
  mapToDHLShipmentFormat,
   mapDHLTrackingResponse
};