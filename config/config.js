// config/config.js

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
    apiUrl: process.env.FEDEX_API_URL || 'https://apis-sandbox.fedex.com'
  },
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
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
    token: process.env.PAQUETE_EXPRESS_TOKEN
  },
};