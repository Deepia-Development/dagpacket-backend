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
              idServicio: 'FIRST_OVERNIGHT',
              name: 'FedEx First Overnight®',
              percentage: 80
            },
            {
              idServicio: 'PRIORITY_OVERNIGHT',
              name: 'FedEx Priority Overnight®',
              percentage: 80
            },
            {
              idServicio: 'STANDARD_OVERNIGHT',
              name: 'FedEx Standard Overnight®',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_2_DAY_AM',
              name: 'FedEx 2Day® AM',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_2_DAY',
              name: 'FedEx 2Day®',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_EXPRESS_SAVER',
              name: 'FedEx Express Saver®',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_GROUND',
              name: 'FedEx Ground®',
              percentage: 30
            },
            {
              idServicio: 'SAME_DAY_CITY',
              name: 'FedEx Nacional Mismo Día, Misma Ciudad',
              percentage: 30
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
              percentage: 30
            },
            {
              idServicio: '258',
              name: 'Envío Económico',
              percentage: 30
            }
          ]
        },
        {
          name: 'DHL',
          services: [
            {
              idServicio: '262',
              name: 'Envío Express',
              percentage: 30
            },
            {
              idServicio: '261',
              name: 'Envío Económico',
              percentage: 30
            }
          ]
        },
        {
          name: 'Fedex',
          services: [
            {
              idServicio: '291',
              name: 'Envío Express',
              percentage: 30
            },
            {
              idServicio: '290',
              name: 'Envío Económico',
              percentage: 30
            }
          ]
        }
      ]
    };

    const paqueteExpressData = {
      name: 'Paquete Express',
      providers: [
        {
          name: 'Paquete Express',
          services: [
            {
              idServicio: 'STD-T',
              name: 'Standard',
              percentage: 30
            },
            {
              idServicio: 'SEG-DS',
              name: 'Express OneDay',
              percentage: 30
            },
            {
              idServicio: 'SEG-A12',
              name: 'Express MidDay',
              percentage: 30
            },
            {
              idServicio: 'SEG-2D',
              name: 'Express 2 Day',
              percentage: 30
            }
          ]
        }
      ]
    };

    const fedex = new Service(fedexData);
    const superenvios = new Service(superenviosData);
    const paqueteExpress = new Service(paqueteExpressData);

    await fedex.save();
    await superenvios.save();
    await paqueteExpress.save();

    console.log('Database initialized with updated data from API response');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = initializeDatabase;