// services/superEnviosService.js

const axios = require('axios');
const config = require('../config/config');
const Service = require('../models/ServicesModel')

class SuperEnviosService {
  constructor() {
    this.token = config.superEnvios.token;
    this.apiUrl = config.superEnvios.apiUrl;
  }

  async getQuote(quoteData) {
    try {
      const requestBody = this.buildQuoteRequestBody(quoteData);            
      const response = await axios.post(`${this.apiUrl}/cotizacion`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log('SuperEnvíos Quote API response:', response.data);
      

      // Aplicar los porcentajes a los precios devueltos
      const modifiedResponse = await this.applyPercentagesToQuote(response.data);

      return modifiedResponse;
    } catch (error) {
      console.error('Error en SuperEnvíos Quote API:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async applyPercentagesToQuote(quoteResponse) {
    const superenviosService = await Service.findOne({ name: 'Superenvios' });

    if (!superenviosService) {
      console.warn('No se encontraron porcentajes para Superenvios');
      return quoteResponse;
    }

    if (quoteResponse.paqueterias && Array.isArray(quoteResponse.paqueterias)) {
      // Filtrar y mapear las paqueterías, excluyendo las que no tengan proveedor o servicio
      quoteResponse.paqueterias = quoteResponse.paqueterias
        .filter(quote => {
          const provider = superenviosService.providers.find(p => p.name === quote.proveedor);
          if (!provider) {
            console.log(`Proveedor no encontrado: ${quote.proveedor}`);
            return null;
          }

          const service = provider.services.find(s => s.idServicio === quote.idServicio);
          if (!service) {
            return null;
          }

          return true;
        })
        .map(quote => {
          const provider = superenviosService.providers.find(p => p.name === quote.proveedor);
          const service = provider.services.find(s => s.idServicio === quote.idServicio);

          const precio = parseFloat(quote.precio_regular);
          let precio_guia = precio / 0.95;

          let precio_venta = precio_guia / (1 - (service.percentage / 100));

          const utilidad = precio_venta - precio_guia;
          const utilidad_dagpacket = utilidad * 0.3;
          const precio_guia_lic = precio_guia + utilidad_dagpacket;

          return {
            ...quote,
            status: service.status,
            precio: precio_venta.toFixed(2),
            precio_regular: precio_guia_lic.toFixed(2),
            precio_guia: precio_guia.toFixed(2),
            precio_api: precio.toFixed(2),
          };
        });
    }

    // Si después del filtrado no hay paqueterías, devolver un objeto vacío
    if (!quoteResponse.paqueterias || quoteResponse.paqueterias.length === 0) {
      console.log('No se encontraron servicios activos después del filtrado');
      return {
        ...quoteResponse,
        paqueterias: []
      };
    }

    return quoteResponse;
}

  buildQuoteRequestBody(quoteData) {
    return {
      token: this.token,
      pais_origen: quoteData.pais_origen,
      pais_destino: quoteData.pais_destino,
      cp_origen: quoteData.cp_origen,
      cp_destino: quoteData.cp_destino,
      alto: quoteData.alto,
      ancho: quoteData.ancho,
      largo: quoteData.largo,
      peso: quoteData.peso,
      seguro: quoteData.seguro || 0,
      valor_declarado: quoteData.valor_declarado || 0
    };
  }

  async generateGuide(shipmentData) {
    // console.log('shipmentData en superEnviosService', shipmentData);
    try {
      const requestBody = this.buildGuideRequestBody(shipmentData);            
      const response = await axios.post(`${this.apiUrl}/etiqueta`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('SuperEnvíos Generate Guide API response:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error en SuperEnvíos Generate Guide API:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  buildGuideRequestBody(shipmentData) {
    return {
      token: this.token,
      origen: {
        nombre: shipmentData.from.name,
        rfc: shipmentData.from.rfc || '',
        telefono: shipmentData.from.phone,
        calle: shipmentData.from.street,
        numero_exterior: shipmentData.from.external_number,
        numero_interior: shipmentData.from.internal_number || '',
        colonia: shipmentData.from.settlement,
        clave_localidad: shipmentData.from.locality_key || '01',
        clave_municipio: shipmentData.from.municipality_key || '01',
        cp: shipmentData.from.zip_code,
        ciudad: shipmentData.from.city,
        iso_estado: shipmentData.from.iso_estado,
        iso_pais: shipmentData.from.iso_pais,
        cruce_1: shipmentData.from.cross_street_1 || '',
        cruce_2: shipmentData.from.cross_street_2 || '',
        descripcion: shipmentData.from.description || '',
        referencia: shipmentData.from.reference || ''
      },
      destino: {
        nombre: shipmentData.to.name,
        rfc: shipmentData.to.rfc || '',
        telefono: shipmentData.to.phone,
        calle: shipmentData.to.street,
        numero_exterior: shipmentData.to.external_number,
        numero_interior: shipmentData.to.internal_number || '',
        colonia: shipmentData.to.settlement,
        clave_localidad: shipmentData.to.locality_key || '01',
        clave_municipio: shipmentData.to.municipality_key || '01',
        cp: shipmentData.to.zip_code,
        ciudad: shipmentData.to.city,
        iso_estado: shipmentData.to.iso_estado,
        iso_pais: shipmentData.to.iso_pais,
        cruce_1: shipmentData.to.cross_street_1 || '',
        cruce_2: shipmentData.to.cross_street_2 || '',
        descripcion: shipmentData.to.description || ''
      },
      paquete: {
        peso: shipmentData.package.weight,
        alto: shipmentData.package.height,
        ancho: shipmentData.package.width,
        largo: shipmentData.package.length,
        idServicio: shipmentData.package.service_id,
        tipo_paquete: shipmentData.package.package_type || 1,
        contenido: shipmentData.package.content || '',
        contenido_detallado: shipmentData.package.detailed_content || '',
        seguro: shipmentData.package.insurance || 0,
        valor_declarado: shipmentData.package.declared_value || 0
      },
      impresion: {
        tipo_impresion: 1,
        tipo_impresora: 'ZPLII',
        tipo_papel: 'PAPER_7X4.75'
      },
      items: shipmentData.items || [{
        clave_producto: '53101601',
        descripcion_producto: 'Producto genérico',
        clave_unidad: 'H87',
        cantidad_producto: '1',
        alto_producto: shipmentData.package.height.toString(),
        ancho_producto: shipmentData.package.width.toString(),
        largo_producto: shipmentData.package.length.toString(),
        valor_producto: shipmentData.package.declared_value.toString(),
        peso_producto: shipmentData.package.weight.toString()
      }]
    };
  }
}

module.exports = new SuperEnviosService();