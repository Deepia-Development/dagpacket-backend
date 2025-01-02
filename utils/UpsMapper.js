const mapUpsResponse = (upsResponse, inputData) => {
    try {
      // Validar la estructura básica de la respuesta
      if (
        !upsResponse ||
        !upsResponse.RateResponse ||
        !upsResponse.RateResponse.RatedShipment ||
        !Array.isArray(upsResponse.RateResponse.RatedShipment) ||
        upsResponse.RateResponse.RatedShipment.length === 0
      ) {
        console.log("La respuesta de UPS no contiene una estructura válida:", upsResponse);
        return [];
      }
  
      // Mapear cada servicio en la respuesta
      return upsResponse.RateResponse.RatedShipment.map((service) => {
        // Extraer el precio total
        const totalPrice = service.TotalCharges?.MonetaryValue || "0.00";
        const basePrice = service.BaseServiceCharge?.MonetaryValue || "0.00";
  
        // Validar el código de respuesta
        const isSuccess = upsResponse.RateResponse.Response.ResponseStatus.Code === "1";
  
        if (!isSuccess) {
          console.log("La cotización no fue exitosa:", service);
          return null;
        }
  
        return {
          idServicio: service.Service?.Code || "N/A",
          logo: "nada",
          proveedor: "UPS",
          nombre_servicio: getUpsServiceName(service.Service?.Code) || "Servicio UPS",
          tiempo_de_entrega: "2-3 días hábiles", // UPS no proporciona esto directamente
          precio_regular: totalPrice,
          zona_extendida: "FALSE", // UPS maneja esto diferente
          precio_zona_extendida: "0.00",
          precio: totalPrice,
          kilos_a_cobrar: service.BillingWeight?.Weight || inputData.peso?.toString() || "0",
          tipo_cotizacion: "API UPS",
          zona: service.Zone || "N/A",
          cobertura_especial: "FALSE",
          precio_api: totalPrice,
          moneda: service.TotalCharges?.CurrencyCode || "MXN",
        };
      }).filter(Boolean); // Eliminar elementos nulos
  
    } catch (error) {
      console.error("Error al mapear la respuesta de UPS:", error);
      return [];
    }
  };
  
  // Función auxiliar para obtener el nombre del servicio según el código
  const getUpsServiceName = (code) => {
    const serviceNames = {
      '65': 'UPS Worldwide Saver',
      '11': 'UPS Standard',
      '07': 'UPS Express',
      '08': 'UPS Expedited',
      '54': 'UPS Express Plus',
      // Agregar más servicios según sea necesario
    };
  
    return serviceNames[code] || 'Servicio UPS';
  };
  
  // Función para validar la respuesta
  const validateUpsResponse = (response) => {
    if (!response?.RateResponse?.Response?.ResponseStatus?.Code) {
      throw new Error('Estructura de respuesta inválida');
    }
  
    if (response.RateResponse.Response.ResponseStatus.Code !== "1") {
      throw new Error(`Error en la respuesta: ${response.RateResponse.Response.ResponseStatus.Description}`);
    }
  
    return true;
  };
  
  module.exports = {
    mapUpsResponse,
    validateUpsResponse
  };