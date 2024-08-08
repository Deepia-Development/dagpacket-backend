const mapFedExResponse = (fedexResponse, inputData) => {
    if (!fedexResponse.output || !fedexResponse.output.rateReplyDetails) {
      console.log('La respuesta de FedEx no contiene rateReplyDetails');
      return [];
    }
  
    return fedexResponse.output.rateReplyDetails.map(service => {
      console.log('Procesando servicio:', service.serviceType);
  
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
      case 'FIRST_OVERNIGHT':
      case 'PRIORITY_OVERNIGHT':
        return "(1 A 2 DÍAS HÁBILES)";
      case 'STANDARD_OVERNIGHT':
        return "(1 A 3 DÍAS HÁBILES)";
      case 'FEDEX_2_DAY_AM':
      case 'FEDEX_2_DAY':
        return "(2 DÍAS HÁBILES)";
      case 'FEDEX_EXPRESS_SAVER':
        return "(3 DÍAS HÁBILES)";
      case 'FEDEX_GROUND':
        return "(3 A 5 DÍAS HÁBILES)";
      default:
        return "Consultar tiempo de entrega";
    }
  };
  
  module.exports = mapFedExResponse;