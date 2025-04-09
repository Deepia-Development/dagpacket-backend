const mapShippingResponse = (shippingResponse) => {
    if (!shippingResponse || !Array.isArray(shippingResponse.result)) {
      console.log('La respuesta de envíos no contiene la estructura esperada:', JSON.stringify(shippingResponse));
      return [];
    }
  
    return shippingResponse.result.map(item => {
      const cotizacion = item.cotizacion.servicios;
      const services = Object.values(cotizacion); // Extraemos los servicios desde las claves de "servicios"
      
      return services.map(service => {
        return {
          idServicio: service.servicio || 'N/A',
          logo: "https://superenvios.mx/api/images/servicios/placeholder_logo.png", // URL de los logos, actualiza si tienes una fuente real
          proveedor: item.clave || 'Proveedor desconocido',
          nombre_servicio: service.tipo_servicio || 'Servicio desconocido',
          tiempo_de_entrega: service.fecha_claro_entrega || 'Consultar tiempo de entrega',
          precio_regular: service.costo_total ? service.costo_total.toFixed(2) : '0.00',
          
            precio: service.costo_total ? service.costo_total.toFixed(2) : '0.00', // ESTE PRECIO DE MOMENTO ES EL MISMO QUE EL PRECIO REGULAR SOLO PARA PRUEBAS
          zona_extendida: "FALSE", // Este valor puede depender de alguna lógica adicional
          precio_zona_extendida: "0.00",
          precio_seguro: service.seguro ? 'Sí' : 'No', // Si la propiedad "seguro" estuviera disponible en el servicio
          fecha_claro_entrega: service.fecha_claro_entrega || 'Fecha no disponible',
          fecha_mensajeria_entrega: service.fecha_mensajeria_entrega || 'Fecha no disponible',
          peso: service.peso || 0,
          status:true,
          peso_volumetrico: service.peso_volumetrico || 0,
          dimensiones: `${service.largo}x${service.ancho}x${service.alto} ${service.dimensiones}`,
          token: service.token || 'N/A'
        };
      });
    }).flat(); // .flat() para combinar todas las respuestas del servicio en un solo array
};


  module.exports = {
    mapShippingResponse,
  };