// Configuración de la API
const CONFIG = {
    API_URL: 'https://wscotizadorqa.estafeta.com/Cotizacion/rest/Cotizador/Cotizacion',
    API_KEY: 'l75842f93713c64d519111b14f15b33eb4',
    CUSTOMER: '5511453',
    SALES_ORGANIZATION: '697',
    TOKEN_URL: 'https://apiqa.estafeta.com:8443/auth/oauth/v2/token',
    CLIENT_ID: 'l75842f93713c64d519111b14f15b33eb4',
    CLIENT_SECRET: 'e5564a79403c42cfac557e2f3095f975'
  };
  
  class EstafetaQuotation {
    constructor() {
      this.accessToken = null;
      this.tokenExpiry = null;
    }
  
    async getAccessToken() {
      try {
        console.log('Solicitando token de acceso...');
        
        // Codificar credenciales en Base64
        const credentials = Buffer.from(`${CONFIG.CLIENT_ID}:${CONFIG.CLIENT_SECRET}`).toString('base64');
  
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
  
        const response = await fetch(CONFIG.TOKEN_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': CONFIG.API_KEY
          },
          body: params
        });
  
        if (!response.ok) {
          const errorBody = await response.text();
          console.error('Respuesta completa del token:', errorBody);
          throw new Error(`Error al obtener token: ${response.status} - ${errorBody}`);
        }
  
        const data = await response.json();
        console.log('Respuesta de token:', data);
        this.accessToken = data.access_token;
        console.log('Token de acceso obtenido exitosamente');
        return this.accessToken;
      } catch (error) {
        console.error('Error en autenticación:', error);
        throw new Error(`Error de autenticación: ${error.message}`);
      }
    }
  
    validateQuotationParams(params) {
      const { originZipCode, destinationZipCode, packageType, weight, dimensions } = params;
      
      if (!originZipCode || !destinationZipCode) {
        throw new Error('Los códigos postales de origen y destino son requeridos');
      }
      
      if (!packageType || typeof packageType !== 'string') {
        throw new Error('El tipo de paquete es requerido y debe ser una cadena de texto');
      }
      
      if (!weight || weight <= 0) {
        throw new Error('El peso debe ser mayor a 0');
      }
      
      if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
        throw new Error('Las dimensiones del paquete son requeridas (length, width, height)');
      }
    }
  
    async getQuotation(params) {
      try {
        this.validateQuotationParams(params);
        
        const accessToken = await this.getAccessToken();
  
        const headers = {
          'Content-Type': 'application/json',
          'apiKey': CONFIG.API_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Customer': CONFIG.CUSTOMER,
          'Sales-organization': CONFIG.SALES_ORGANIZATION
        };
  
        const body = {
          origin: params.originZipCode,
          destination: [params.destinationZipCode],
          weight: params.weight,
          length: params.dimensions.length,
          width: params.dimensions.width,
          height: params.dimensions.height,
          packagingType: params.packageType,
          isInsurance: params.isInsurance || false,
          declaredValue: params.itemValue || 0
        };
  
        console.log('\nEnviando solicitud con los siguientes datos:');
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Body:', JSON.stringify(body, null, 2));
  
        const response = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
        });
  
        const responseBody = await response.text();
        console.log('\nRespuesta completa:', responseBody);
  
        if (!response.ok) {
          throw new Error(`Error en cotización: ${response.status} - ${responseBody}`);
        }
  
        return JSON.parse(responseBody);
      } catch (error) {
        console.error('Error al obtener cotización:', error);
        throw error;
      }
    }
  }
  
  // Función principal que ejecuta la cotización
  async function main() {
    try {
      const quotationService = new EstafetaQuotation();
      
      const quotationParams = {
        originZipCode: '62320',
        destinationZipCode: '01000',
        packageType: 'PAQUETE',  // Cambiado a mayúsculas
        weight: 10,
        dimensions: {
          length: 10,
          width: 10,
          height: 10
        },
        isInsurance: false,
        itemValue: 10
      };
  
      console.log('Iniciando proceso de cotización...');
      const quotation = await quotationService.getQuotation(quotationParams);
      console.log('\nCotización exitosa:');
      console.log(JSON.stringify(quotation, null, 2));
    } catch (error) {
      console.error('\nError en la aplicación:', error.message);
    }
  }
  
  // Ejecutar el script
  main();