// config/config.js

require('dotenv').config();

module.exports = {
  superEnvios: {
    token: process.env.SUPER_ENVIOS_TOKEN,
    apiUrl: process.env.SUPER_ENVIOS_API || 'https://qa.superenvios.mx/api'
  },
  fedex: {
    token: process.env.FEDEX_TOKEN,
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER,
    clientId: process.env.FEDEX_CLIENT_ID,
    apiSecret: process.env.FEDEX_API_SECRET,
    apiUrl: process.env.FEDEX_API_URL || 'https://apis-sandbox.fedex.com'
  },
  // Puedes agregar otras configuraciones aquí si las necesitas
};