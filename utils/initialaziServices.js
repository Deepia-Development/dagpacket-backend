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
              percentage: 30
            },
            {
              idServicio: 'PRIORITY_OVERNIGHT',
              name: 'FedEx Priority Overnight®', 
              percentage: 30
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
            },
            {
              idServicio: 'INTERNATIONAL_FIRST',
              name: 'FedEx International First®',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS',
              name: 'FedEx International Priority® Express',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_INTERNATIONAL_PRIORITY',
              name: 'FedEx International Priority®',
              percentage: 30
            },
            {
              idServicio: 'INTERNATIONAL_ECONOMY',
              name: 'FedEx International Economy®',
              percentage: 30
            },
            {
              idServicio: 'FEDEX_INTERNATIONAL_CONNECT_PLUS',
              name: 'FedEx International Connect Plus',
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
   
    const dhlData = {
      name: 'DHL',
      providers: [
        {
          name: 'DHL',
          services: [
            {
              idServicio: 'N',
              name: 'EXPRESS DOMESTIC',
              percentage: 30
            },
            {
              idServicio: '7',
              name: 'EXPRESS EASY DOC',  
              percentage: 30
            },
            {
              idServicio: 'C',
              name: 'MEDICAL EXPRESS',
              percentage: 30  
            },
            {
              idServicio: '5',
              name: 'EXPRESS EDOMM',
              percentage: 30
            },
            {
              idServicio: 'J',
              name: 'DOMESTICO ENVIO RETORNO',
              percentage: 30
            },
            {
              idServicio: '5',
              name: 'SAMEDAY SPRINTLINE',
              percentage: 30
            },
            {
              idServicio: 'J',
              name: 'DOMESTIC SHIPMENT DEPARTURE',  
              percentage: 30
            },
            {
              idServicio: 'G',
              name: 'ECONOMY SELECT DOMESTIC',
              percentage: 30
            },
            {
              idServicio: 'T',
              name: 'EXPRESS 12:00',
              percentage: 30
            },
            {
              idServicio: 'D',
              name: 'EXPRESS WORLDWIDE',
              percentage: 30
            },
            {
              idServicio: '7',
              name: 'EXPRESS EASY DOC',
              percentage: 30
            }
          ]
        }
      ]
    };

    const fedex = new Service(fedexData);
    const superenvios = new Service(superenviosData);
    const paqueteExpress = new Service(paqueteExpressData);
    const dhl = new Service(dhlData);

    await fedex.save();
    await superenvios.save();  
    await paqueteExpress.save();
    await dhl.save();

    console.log('Database initialized with updated data from API response');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = initializeDatabase;