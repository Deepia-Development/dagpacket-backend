require('dotenv').config();

module.exports = {
  superEnvios: {
    token: process.env.SUPER_ENVIOS_TOKEN,
    apiUrl: process.env.SUPER_ENVIOS_API
  },
  fedex: {
    token: process.env.FEDEX_TOKEN,
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER,
    clientId: process.env.FEDEX_CLIENT_ID,
    apiSecret: process.env.FEDEX_API_SECRET,
    clientIdTracking: process.env.FEDEX_CLIENT_ID_TRACK,
    apiSecretTracking: process.env.FEDEX_API_SECRET_TRACK,
    apiUrl: process.env.FEDEX_API_URL || 'https://apis-sandbox.fedex.com'
  },
  estafeta: {
    apiUrl: process.env.ESTAFETA_API_QOUTE_URL || 'https://wscotizadorqa.estafeta.com/Cotizacion/rest/Cotizador/Cotizacion',
    labelUrl: process.env.ESTAFETA_LABEL_URL,
    apiKeyLabel: process.env.ESTAFETA_LABEL_API_KEY,
    apiSecretLabel: process.env.ESTAFETA_LABEL_API_SECRET,
    token: process.env.ESTAFETA_TOKEN_URL,
    apiKey: process.env.ESTAFETA_API_KEY,
    apiSecret: process.env.ESTAFETA_API_SECRET,
    customerId: process.env.ESTAFETA_CUSTOMER_ID,
    salesId: process.env.ESTAFETA_SALES_ORGANIZATION,
    trackingUrl: process.env.ESTAFETA_TRACKING_URL,
    trackingApiKey: process.env.ESTAFETA_TRACKING_API_KEY,
    trackingApiSecret: process.env.ESTAFETA_TRACKING_API_SECRET,

  },
  backendUrl: process.env.BACKEND_URL || 'https://dagpacket-backend.onrender.com',
  RECARGAS_URL: process.env.RECARGAS_URL,
  PAGO_SERVICIOS_URL: process.env.PAGO_SERVICIOS_URL,
  RECARGAS_CREDENTIALS: {
    terminalId: process.env.RECARGAS_TERMINAL_ID,
    clerkId: process.env.RECARGAS_CLERK_ID,
    merchantId: process.env.RECARGAS_MERCHANT_ID
  },
  PAGO_SERVICIOS_CREDENTIALS: {
    terminalId: process.env.PAGO_SERVICIOS_TERMINAL_ID,
    clerkId: process.env.PAGO_SERVICIOS_CLERK_ID,
    merchantId: process.env.PAGO_SERVICIOS_MERCHANT_ID
  },
  paqueteExpress: {
    quoteUrl: process.env.PAQUETE_EXPRESS_QUOTE_URL,
    createShipmentUrl: process.env.PAQUETE_EXPRESS_CREATE_SHIPMENT,
    reportUrl: process.env.PAQUETE_EXPRESS_REPORT_URL,
    user: process.env.PAQUETE_EXPRESS_USER,
    password: process.env.PAQUETE_EXPRESS_PASSWORD,
    token: process.env.PAQUETE_EXPRESS_TOKEN,
    trackingUrl: process.env.PAQUETE_EXPRESS_TRAZADOR
  },
  exchangeRate: {
    exchangeApiUrl: process.env.EXCHANGE_API_URL,
    token: process.env.EXCHANGE_API_TOKEN
  },
  dhl: {
    apiBase: process.env.DHL_API_BASE,
    token: process.env.DHL_TOKEN,
    account: process.env.DHL_ACCOUNT,
    user: process.env.DHL_USER,
    password: process.env.DHL_PASSWORD
  },
};