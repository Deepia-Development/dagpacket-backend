const Service = require('../models/ServicesModel'); // Asegúrate de que la ruta al modelo sea correcta

async function initializeDatabase() {
  try {
    await Service.deleteMany({}); 
    
    const fedexData = {
      name: 'Fedex',
      providers: [
        {
          name: 'Fedex',
          services: [
            {
              idServicio: 'PRIORITY_OVERNIGHT',
              name: 'FedEx Nacional 10:30 a.m.',
              percentage: 21.83 // (25.00 - 20.52) / 20.52 * 100
            },
            {
              idServicio: 'STANDARD_OVERNIGHT',
              name: 'FedEx Nacional Día Siguiente',
              percentage: 21.85 // (19.63 - 16.11) / 16.11 * 100
            },
            {
              idServicio: 'FEDEX_EXPRESS_SAVER',
              name: 'FedEx Nacional Económico',
              percentage: 24.06 // (13.87 - 11.18) / 11.18 * 100
            },
            {
              idServicio: 'SAME_DAY_CITY',
              name: 'FedEx Nacional Mismo Día, Misma Ciudad',
              percentage: 24.00 // (7.13 - 5.75) / 5.75 * 100
            }
          ]
        }
      ]
    };

    const superenviosData = {
      name: 'Superenvios',
      providers: [
        {
          name: 'Estafeta',
          services: [
            {
              idServicio: '257',
              name: 'Envío Express',
              percentage: 30 // (273.15 - 273.15) / 273.15 * 100
            },
            {
              idServicio: '258',
              name: 'Envío Económico',
              percentage: 30 // (126.79 - 126.79) / 126.79 * 100
            }
          ]
        },
        {
          name: 'DHL',
          services: [
            {
              idServicio: '262',
              name: 'Envío Express',
              percentage: 30 // (191.90 - 191.90) / 191.90 * 100
            },
            {
              idServicio: '261',
              name: 'Envío Económico',
              percentage: 30 // (194.34 - 194.34) / 194.34 * 100
            }
          ]
        },
        {
          name: 'Fedex',
          services: [
            {
              idServicio: '291',
              name: 'Envío Express',
              percentage: 30 // (148.00 - 148.00) / 148.00 * 100
            },
            {
              idServicio: '290',
              name: 'Envío Económico',
              percentage: 30 // (122.45 - 122.45) / 122.45 * 100
            }
          ]
        }
      ]
    };

    const fedex = new Service(fedexData);
    const superenvios = new Service(superenviosData);

    await fedex.save();
    await superenvios.save();

    console.log('Database initialized with test data from quotation');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = initializeDatabase;