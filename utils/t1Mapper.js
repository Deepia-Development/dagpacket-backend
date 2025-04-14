const mapShippingResponse = (shippingResponse) => {
  if (!shippingResponse || !Array.isArray(shippingResponse.result)) {
    console.log('La respuesta de envíos no contiene la estructura esperada:', JSON.stringify(shippingResponse));
    return { paqueterias: [] };
  }

  const paqueterias = shippingResponse.result.flatMap(item => {
    const servicios = item.cotizacion?.servicios;
    if (!servicios) {
      console.warn('Faltan servicios en cotización:', item);
      return [];
    }

    return Object.values(servicios).map(service => {
      const precio = service.costo_total || 0;
      return {
        idServicio: service.servicio || 'N/A',
        logo: "https://superenvios.mx/api/images/servicios/placeholder_logo.png",
        proveedor: item.clave || 'Proveedor desconocido',
        nombre_servicio: service.tipo_servicio || 'Servicio desconocido',
        tiempo_de_entrega: service.fecha_claro_entrega || 'Consultar tiempo de entrega',
        precio_regular: precio.toFixed(2),
        precio: precio.toFixed(2), // Inicialmente igual, será modificado después
        zona_extendida: "FALSE", // A actualizar si aplica
        precio_zona_extendida: "0.00",
        precio_seguro: service.seguro ? 'Sí' : 'No',
        fecha_claro_entrega: service.fecha_claro_entrega || 'Fecha no disponible',
        fecha_mensajeria_entrega: service.fecha_mensajeria_entrega || 'Fecha no disponible',
        peso: service.peso || 0,
        peso_volumetrico: service.peso_volumetrico || 0,
        dimensiones: service.largo && service.ancho && service.alto
          ? `${service.largo}x${service.ancho}x${service.alto}`
          : service.dimensiones || 'No especificado',
        status: true,
        token: service.token || 'N/A',
      };
    });
  });

  return { paqueterias };
};



  module.exports = {
    mapShippingResponse,
  };