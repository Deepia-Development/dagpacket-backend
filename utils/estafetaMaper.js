const estafetaMapResponse = (estafetaMapResponse, inputData) => {
  if (!estafetaMapResponse || !inputData) {
    console.log(
      "La respuesta de Estafeta no contiene la estructura esperada:",
      JSON.stringify(estafetaMapResponse)
    );
    return [];
  }

  return estafetaMapResponse.Quotation.Service.map((product) => {
    const totalPrice =
      product.totalPrice.find((price) => price.currencyType === "BILLABLE") ||
      product.totalPrice[0];
    return {
      idService: product.ServiceCode || "N/A",
      logo: "nada",
      proveedor: "Estafeta",
      nombre_servicio: product.ServiceName,
      tiempro_de_entrega: "Consultar tiempo de entrega",
      precio_regular: totalPrice?.price?.toFixed(2) || "0.00",
      zona_extendida: "FALSE",
      precio_zona_extendida: "0.00",
      precio: totalPrice?.price?.toFixed(2) || "0.00",
      kilos_a_cobrar: inputData.peso?.toString() || "0",
      tipo_cotizacion: "API Estafeta",
      zona: "N/A",
      cobertura_especial: "FALSE",
    };
  });
};



module.exports = {
  estafetaMapResponse,
};