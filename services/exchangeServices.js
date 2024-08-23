const axios = require('axios');
const config = require('../config/config');

let cachedRate = null;
let lastUpdateTime = null;

async function getExchangeRate() {
  const currentTime = new Date();
  
  if (cachedRate && lastUpdateTime && (currentTime - lastUpdateTime) < 24 * 60 * 60 * 1000) {
    console.log('Usando tasa de cambio en caché');
    return cachedRate;
  }

  try {
    const response = await axios.get(config.exchangeRate.exchangeApiUrl, {
      params: {
        access_key: config.exchangeRate.token,
        base: 'EUR',
        symbols: 'USD,MXN'
      }
    });

    if (response.data.success) {
      const eurToUsdRate = response.data.rates.USD;
      const eurToMxnRate = response.data.rates.MXN;

      if (!eurToUsdRate || !eurToMxnRate) {
        console.warn('No se encontraron las tasas de cambio necesarias. Usando valor por defecto.');
        return 20; // Valor por defecto USD a MXN
      }
      // Calcular la tasa de USD a MXN
      const usdToMxnRate = eurToMxnRate / eurToUsdRate;
      console.log(`Nueva tasa de cambio USD a MXN obtenida: ${usdToMxnRate}`);      
      // Actualizar la caché
      cachedRate = usdToMxnRate;
      lastUpdateTime = currentTime;

      return usdToMxnRate;
    } else {
      console.warn('La API de tipo de cambio no devolvió una respuesta exitosa. Usando valor por defecto o caché si está disponible.');
      return cachedRate || 20; // Usar caché si está disponible, sino valor por defecto
    }
  } catch (error) {
    console.error('Error al obtener el tipo de cambio:', error.message);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
    console.warn('Usando valor de tipo de cambio en caché o por defecto.');
    return cachedRate || 20; // Usar caché si está disponible, sino valor por defecto
  }
}

module.exports = { getExchangeRate };