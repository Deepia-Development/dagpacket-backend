const mapEstafetaResponse = (estafetaResponse, inputData) => {
  // Validar si la respuesta tiene la estructura de paqueterías

  console.log("Estafeta response:", estafetaResponse);
  console.log("Input data:", inputData);
  if (
    !estafetaResponse ||
    !estafetaResponse.paqueterias ||
    !Array.isArray(estafetaResponse.paqueterias) ||
    estafetaResponse.paqueterias.length === 0
  ) {
    // Si no tiene la estructura de paqueterías, verificar si tiene la estructura original de Quotation
    if (
      !estafetaResponse ||
      !estafetaResponse.Quotation ||
      !Array.isArray(estafetaResponse.Quotation) ||
      estafetaResponse.Quotation.length === 0 ||
      !estafetaResponse.Quotation[0].Service ||
      !Array.isArray(estafetaResponse.Quotation[0].Service)
    ) {
      console.log(
        "La respuesta de Estafeta no contiene ninguna estructura válida:",
        estafetaResponse
      );
      return []; // Devuelve un arreglo vacío si ninguna estructura es válida
    }

    // Si tiene la estructura de Quotation, mapear desde ahí
    return estafetaResponse.Quotation[0].Service.map((service) => ({
      idServicio: service.ServiceCode || "N/A",
      logo: "nada",
      proveedor: "Estafeta",
      nombre_servicio: service.ServiceName || "Servicio no especificado",
      tiempo_de_entrega: service.MaxWarranty || "Consultar tiempo de entrega",
      precio_regular: service.ListPrice ? service.ListPrice.toString() : "0.00",
      zona_extendida: service.CoversWarranty === "True" ? "TRUE" : "FALSE",
      precio_zona_extendida: service.FuelChargeListPrice
        ? service.FuelChargeListPrice.toString()
        : "0.00",
      precio: service.TotalAmount ? service.TotalAmount.toString() : "0.00",
      kilos_a_cobrar: inputData.peso?.toString() || "0",
      tipo_cotizacion: "API Estafeta",
      zona: estafetaResponse.Quotation[0].DeliveryZone || "N/A",
      cobertura_especial: service.CoversWarranty || "FALSE",
    }));
  }

  // Si ya tiene la estructura de paqueterías, retornarla directamente
  return estafetaResponse.paqueterias;
};

module.exports = {
  mapEstafetaResponse,
};
