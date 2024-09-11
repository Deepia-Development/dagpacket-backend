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
      cobertura_especial: "FALSE"
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

module.exports = {
  mapDHLResponse,
  mapToDHLShipmentFormat
};