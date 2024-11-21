const { stat } = require('fs-extra');
const Service = require('../models/ServicesModel'); // Asegúrate de que la ruta al modelo sea correcta
const Roles = require('../models/RolesModel'); // Asegúrate de que la ruta al modelo sea correcta
async function initializeDatabase() {
  try {
    await Service.deleteMany({}); 
    await Roles.deleteMany({});
    console.log('Database cleared');
    const fedexData = {
      name: 'Fedex',
      providers: [
        {
          name: 'Fedex',
          services: [
            {
              idServicio: 'FIRST_OVERNIGHT',
              name: 'FedEx First Overnight®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'PRIORITY_OVERNIGHT',
              name: 'FedEx Priority Overnight®', 
              percentage: 30,
              status: true
            },
            {
              idServicio: 'STANDARD_OVERNIGHT',
              name: 'FedEx Standard Overnight®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_2_DAY_AM',
              name: 'FedEx 2Day® AM',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_2_DAY',
              name: 'FedEx 2Day®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_EXPRESS_SAVER',
              name: 'FedEx Express Saver®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_GROUND',
              name: 'FedEx Ground®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'SAME_DAY_CITY',
              name: 'FedEx Nacional Mismo Día, Misma Ciudad',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'INTERNATIONAL_FIRST',
              name: 'FedEx International First®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS',
              name: 'FedEx International Priority® Express',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_INTERNATIONAL_PRIORITY',
              name: 'FedEx International Priority®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'INTERNATIONAL_ECONOMY',
              name: 'FedEx International Economy®',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'FEDEX_INTERNATIONAL_CONNECT_PLUS',
              name: 'FedEx International Connect Plus',
              percentage: 30,
              status: true
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
              percentage: 30,
              status: true
            },
            {
              idServicio: '258',
              name: 'Envío Económico', 
              percentage: 30,
              status: true
            }
          ]
        },
        {
          name: 'DHL',
          services: [
            {
              idServicio: '262',
              name: 'Envío Express',
              percentage: 30,
              status: true
            },
            {
              idServicio: '261',
              name: 'Envío Económico',
              percentage: 30,
              status: true
            }
          ]
        },
        {
          name: 'Fedex',
          services: [
            {
              idServicio: '291',
              name: 'Envío Express',
              percentage: 30,
              status: true
            },
            {
              idServicio: '290',
              name: 'Envío Económico',
              percentage: 30,
              status: true
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
              percentage: 30,
              status: true
            },
            {
              idServicio: 'SEG-DS',
              name: 'Express OneDay',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'SEG-A12',
              name: 'Express MidDay',  
              percentage: 30,
              status: true
            },
            {
              idServicio: 'SEG-2D',
              name: 'Express 2 Day',
              percentage: 30,
              status: true
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
              percentage: 30,
              status: true
            },
            {
              idServicio: '7',
              name: 'EXPRESS EASY DOC',  
              percentage: 30,
              status: true
            },
            {
              idServicio: 'C',
              name: 'MEDICAL EXPRESS',
              percentage: 30,
              status: true  
            },
            {
              idServicio: '5',
              name: 'EXPRESS EDOMM',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'J',
              name: 'DOMESTICO ENVIO RETORNO',
              percentage: 30,
              status: true
            },
            {
              idServicio: '5',
              name: 'SAMEDAY SPRINTLINE',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'J',
              name: 'DOMESTIC SHIPMENT DEPARTURE',  
              percentage: 30,
              status: true
            },
            {
              idServicio: 'G',
              name: 'ECONOMY SELECT DOMESTIC',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'T',
              name: 'EXPRESS 12:00',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'D',
              name: 'EXPRESS WORLDWIDE',
              percentage: 30,
              status: true
            },
            {
              idServicio: '7',
              name: 'EXPRESS EASY DOC',
              percentage: 30,
              status: true  }
          ]
        }
      ]
    };

    const estafetaData = {
      name: 'Estafeta',
      providers: [
        {
          name: 'Estafeta',
          services: [
            {
              idServicio: 'STD-T',  
              name: 'Standard',
              percentage: 30,
              stat  : true
            },
            {
              idServicio: 'SEG-DS',
              name: 'Express OneDay',
              percentage: 30,
              status: true
            },
            {
              idServicio: 'SEG-A12',
              name: 'Express MidDay',  
              percentage: 30,
              status: true
            },
            {
              idServicio: 'SEG-2D',
              name: 'Express 2 Day',
              percentage: 30 ,
              status: true
            }
          ]
        }
      ]
    };

    const roleData = {
      role_name: "Admin",
      has_wallet: true,
      type: "Admin",
      permissions: [
          {
              category: "Lockers",
              actions: ["Publicidad de Lockers", "Estatus de Lockers"]
          },
          {
              category: "Gestion Administrativa",
              actions: [
                  "Historial de Recargas",
                  "Cortes de Caja",
                  "Solicitudes de Recarga",
                  "Panel de Administracion",
                  "Dashboard General"
              ]
          },
          {
              category: "Licenciatarios",
              actions: [
                  "Dashboard de Inversor",
                  "Solicitudes de Cancelacion",
                  "Pago de Servicios",
                  "Caja",
                  "Resumen"
              ]
          },
          {
              category: "Paquetes",
              actions: ["Empaques", "Envios", "Cotizar Envio"]
          }
      ]
  };

  const role = new Roles(roleData);
    const fedex = new Service(fedexData);
    const superenvios = new Service(superenviosData);
    const paqueteExpress = new Service(paqueteExpressData);
    const dhl = new Service(dhlData);
    const estafeta = new Service(estafetaData);

    await role.save();
    await fedex.save();
    await superenvios.save();  
    await paqueteExpress.save();
    await dhl.save();
    await estafeta.save();

    console.log('Database initialized with updated data from API response');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = initializeDatabase;