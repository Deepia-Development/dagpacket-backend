const mapShippingResponse = (shippingResponse) => {
  if (!shippingResponse || !Array.isArray(shippingResponse.rates)) {
    console.log(
      "La respuesta de envíos no contiene la estructura esperada:",
      JSON.stringify(shippingResponse)
    );
    return { paqueterias: [] };
  }

  const paqueterias = shippingResponse.rates.map((rate) => {
    const precio = parseFloat(rate.total || 0);
    const extraFees =
      rate.extra_fees?.reduce(
        (sum, fee) => sum + (parseFloat(fee.value) || 0),
        0
      ) || 0;

    return {
      idServicio: rate.id || "N/A",
      logo: "https://superenvios.mx/api/images/servicios/placeholder_logo.png",
      proveedor: rate.provider_name || "Proveedor desconocido",
      nombre_servicio: rate.provider_service_name || "Servicio desconocido",
      tiempo_de_entrega: `${rate.days} día(s)` || "Consultar tiempo de entrega",
      precio: precio.toFixed(2),
      precioConComision: precio.toFixed(2),
      precioOriginal: precio.toFixed(2),
      precio_api: precio.toFixed(2),
      precio_guia: precio.toFixed(2) / 0.95,
      precio_regular: (precio * 1.15).toFixed(2),
      zona_extendida: "FALSE", // No se proporciona en el JSON original
      precio_zona_extendida: "0.00", // No se proporciona en el JSON original
      precio_seguro: rate.insurable ? "Sí" : "No",
      fecha_claro_entrega: "Fecha no disponible", // No se proporciona, se puede calcular si hay fecha de envío
      fecha_mensajeria_entrega: "Fecha no disponible",
      peso: rate.weight || 0,
      peso_volumetrico: 0, // No disponible en el JSON
      servicio: "Solo Envios", // Asumido como el servicio de Solo Envios
      dimensiones: "No especificado", // No disponible en el JSON
      status: rate.success,
      token: rate.id || "N/A",
    };
  });

  return { paqueterias };
};

module.exports = {
  mapShippingResponse,
};
