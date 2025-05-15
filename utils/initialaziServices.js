const { stat } = require("fs-extra");
const Service = require("../models/ServicesModel"); // Asegúrate de que la ruta al modelo sea correcta
const Roles = require("../models/RolesModel"); // Asegúrate de que la ruta al modelo sea correcta
const WarehouseModel = require("../models/WarehouseModel");
const PackingModel = require("../models/PackingModel");
const { ObjectId } = require("mongodb"); // Asegúrate de importar ObjectId si usas Node.js

async function initializeDatabase() {
  try {
    // await Service.deleteMany({});
    //  await Service.deleteMany({ _id: new ObjectId("6750ec2fbf8fdb7338796c5d") });

    //await Roles.deleteMany({});

    const upsData = {
      name: "UPS",
      providers: [
        {
          name: "UPS",
          services: [
            {
              idServicio: "UPS Worldwide Saver_65",
              name: "UPS Worldwide Saver",
              percentage: 30,
              status: true,
            },
            {
              idServicio: "UPS Standard_11",
              name: "UPS Standard",
              percentage: 30,
              status: true,
            },
          ],
        },
      ],
    };

    async function updateWarehouseStock() {
      try {
        // Buscar todos los paquetes en PackingModel
        const packingData = await PackingModel.find();
    
        // Transformar los datos para que cumplan con la estructura del stock
        const formattedStock = packingData.map((packing) => ({
          packing: packing._id, // O el campo adecuado según tu modelo
          quantity: packing.quantity || 0, // Asegurar que tenga cantidad
        }));
    
        // Verificar si ya existe el almacén
        let warehouse = await WarehouseModel.findOne({ name: "Almacen DagPacket" });
    
        if (warehouse) {
          warehouse.stock = formattedStock;
        } else {
          warehouse = new WarehouseModel({
            name: "Almacen DagPacket",
            stock: formattedStock,
          });
        }
    
        await warehouse.save();
        console.log("Stock actualizado en el almacén:", warehouse);
        return warehouse;
      } catch (error) {
        console.error("Error al actualizar el almacén:", error);
        return { error: "No se pudo actualizar el stock del almacén" };
      }
    }
    
    // Llamar a la función
    // updateWarehouseStock();
    // const t1EnviosData = {
    //   name: "T1Envios",
    //   providers: [
    //     {
    //       name: "DHL",
    //       services: [
    //         {
    //           idServicio: "ECONOMY SELECT DOMESTIC",
    //           name: "ECONOMY SELECT DOMESTIC",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "EXPRESS DOMESTIC",
    //           name: "EXPRESS DOMESTIC",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "Dia Siguiente",
    //           name: "Dia Siguiente",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "Economico / 2 dias",
    //           name: "Economico / 2 dias",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "FEDEX",
    //       services: [
    //         {
    //           idServicio: "FEDEX_EXPRESS_SAVER",
    //           name: "FEDEX_EXPRESS_SAVER",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "STANDARD_OVERNIGHT",
    //           name: "STANDARD_OVERNIGHT",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "UPS",
    //       services: [
    //         {
    //           idServicio: "UPS_SAVER",
    //           name: "UPS_SAVER",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "UPS_STANDAR",
    //           name: "UPS_STANDAR",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "EXPRESS",
    //       services: [
    //         {
    //           idServicio: "STD-T",
    //           name: "STD-T",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "T1ENVIOS",
    //       services: [
    //         {
    //           idServicio: "ULTIMA_MILLA",
    //           name: "ULTIMA_MILLA",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "JTEXPRESS",
    //       services: [
    //         {
    //           idServicio: "Nacional",
    //           name: "Nacional",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "ESTAFETA",
    //       services: [
    //         {
    //           idServicio: "Dia Sig.",
    //           name: "Dia Siguiente",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "2 Dias",
    //           name: "2 Dias",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //   ],
    // };

    const turboEnvios = {
      name: "TurboEnvios",
      providers: [
        {
          name: "DHL",
          services: [
            {
              idServicio: "ECONOMY SELECT DOMESTIC",
              name: "ECONOMY SELECT DOMESTIC",
              percentage: 30,
              status: true,
            },
            {
              idServicio: "EXPRESS DOMESTIC",
              name: "EXPRESS DOMESTIC",
              percentage: 30,
              status: true,
            }
          ],
        },
        {
          name: "FEDEX",
          services: [
            {
              idServicio: "FEDEX_EXPRESS_SAVER",
              name: "FEDEX_EXPRESS_SAVER",
              percentage: 30,
              status: true,
            },
            {
              idServicio: "STANDARD_OVERNIGHT",
              name: "STANDARD_OVERNIGHT",
              percentage: 30,
              status: true,
            },
          ],
        },
        {
          name: "UPS",
          services: [
            {
              idServicio: "UPS_SAVER",
              name: "UPS_SAVER",
              percentage: 30,
              status: true,
            },
            {
              idServicio: "UPS_STANDAR",
              name: "UPS_STANDAR",
              percentage: 30,
              status: true,
            },
          ],
        },
      ],
    };
    
    
    
    //console.log("Database cleared");
    // const fedexData = {
    //   name: "Fedex",
    //   providers: [
    //     {
    //       name: "Fedex",
    //       services: [
    //         {
    //           idServicio: "FIRST_OVERNIGHT",
    //           name: "FedEx First Overnight®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "PRIORITY_OVERNIGHT",
    //           name: "FedEx Priority Overnight®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "STANDARD_OVERNIGHT",
    //           name: "FedEx Standard Overnight®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_2_DAY_AM",
    //           name: "FedEx 2Day® AM",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_2_DAY",
    //           name: "FedEx 2Day®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_EXPRESS_SAVER",
    //           name: "FedEx Express Saver®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_GROUND",
    //           name: "FedEx Ground®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "SAME_DAY_CITY",
    //           name: "FedEx Nacional Mismo Día, Misma Ciudad",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "INTERNATIONAL_FIRST",
    //           name: "FedEx International First®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_INTERNATIONAL_PRIORITY_EXPRESS",
    //           name: "FedEx International Priority® Express",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_INTERNATIONAL_PRIORITY",
    //           name: "FedEx International Priority®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "INTERNATIONAL_ECONOMY",
    //           name: "FedEx International Economy®",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "FEDEX_INTERNATIONAL_CONNECT_PLUS",
    //           name: "FedEx International Connect Plus",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //   ],
    // };

    // const superenviosData = {
    //   name: "Superenvios",
    //   providers: [
    //     {
    //       name: "Estafeta",
    //       services: [
    //         {
    //           idServicio: "257",
    //           name: "Envío Express",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "258",
    //           name: "Envío Económico",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "DHL",
    //       services: [
    //         {
    //           idServicio: "262",
    //           name: "Envío Express",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "261",
    //           name: "Envío Económico",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //     {
    //       name: "Fedex",
    //       services: [
    //         {
    //           idServicio: "291",
    //           name: "Envío Express",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "290",
    //           name: "Envío Económico",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //   ],
    // };

    // const paqueteExpressData = {
    //   name: "Paquete Express",
    //   providers: [
    //     {
    //       name: "Paquete Express",
    //       services: [
    //         {
    //           idServicio: "STD-T",
    //           name: "Standard",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "SEG-DS",
    //           name: "Express OneDay",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "SEG-A12",
    //           name: "Express MidDay",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "SEG-2D",
    //           name: "Express 2 Day",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //   ],
    // };

    // const dhlData = {
    //   name: "DHL",
    //   providers: [
    //     {
    //       name: "DHL",
    //       services: [
    //         {
    //           idServicio: "N",
    //           name: "EXPRESS DOMESTIC",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "7",
    //           name: "EXPRESS EASY DOC",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "C",
    //           name: "MEDICAL EXPRESS",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "5",
    //           name: "EXPRESS EDOMM",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "J",
    //           name: "DOMESTICO ENVIO RETORNO",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "5",
    //           name: "SAMEDAY SPRINTLINE",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "J",
    //           name: "DOMESTIC SHIPMENT DEPARTURE",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "G",
    //           name: "ECONOMY SELECT DOMESTIC",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "T",
    //           name: "EXPRESS 12:00",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "D",
    //           name: "EXPRESS WORLDWIDE",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "7",
    //           name: "EXPRESS EASY DOC",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //   ],
    // };

    // const estafetaData = {
    //   name: "Estafeta",
    //   providers: [
    //     {
    //       name: "Estafeta",
    //       services: [
    //         {
    //           idServicio: "STD-T",
    //           name: "Standard",
    //           percentage: 30,
    //           stat: true,
    //         },
    //         {
    //           idServicio: "SEG-DS",
    //           name: "Express OneDay",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "SEG-A12",
    //           name: "Express MidDay",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "SEG-2D",
    //           name: "Express 2 Day",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "50",
    //           name: "11:30",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "H0",
    //           name: "12:30",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "60",
    //           name: "Dia Sig.",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "D0",
    //           name: "2 Dias",
    //           percentage: 30,
    //           status: true,
    //         },
    //         {
    //           idServicio: "70",
    //           name: "Terrestre",
    //           percentage: 30,
    //           status: true,
    //         },
    //       ],
    //     },
    //   ],
    // };

    const roleRepartidor = {
      role_name: "REPARTIDOR",
      has_wallet: false,
      type: "REPARTIDOR",
      permissions: [{}],
    };

    // const roleData = {
    //   role_name: "ADMIN",
    //   has_wallet: true,
    //   type: "ADMIN",
    //   permissions: [
    //     {
    //       category: "Lockers",
    //       actions: ["Publicidad de Lockers", "Estatus de Lockers"],
    //     },
    //     {
    //       category: "Gestion Administrativa",
    //       actions: [
    //         "Historial de Recargas",
    //         "Cortes de Caja",
    //         "Solicitudes de Recarga",
    //         "Panel de Administracion",
    //         "Dashboard General",
    //       ],
    //     },
    //     {
    //       category: "Licenciatarios",
    //       actions: [
    //         "Dashboard de Inversor",
    //         "Solicitudes de Cancelacion",
    //         "Pago de Servicios",
    //         "Caja",
    //         "Resumen",
    //       ],
    //     },
    //     {
    //       category: "Paquetes",
    //       actions: ["Empaques", "Envios", "Cotizar Envio"],
    //     },
    //   ],
    // };

    // const rolePendiente = {
    //   role_name: "PENDIENTE",
    //   has_wallet: false,
    //   type: "PENDIENTE",
    // };

    // const RoleClienteCorporativo = {
    //   role_name: "CLIENTE_CORPORATIVO",
    //   has_wallet: true,
    //   type: "CLIENTE_CORPORATIVO",
    //   permissions: [
    //     {
    //       category: "Gestion Administrativa",
    //       actions: ["Cortes de Caja", "Dashboard General"],
    //     },
    //     {
    //       category: "Licenciatarios",
    //       actions: ["Solicitudes de Cancelacion", "Pago de Servicios", "Caja"],
    //     },
    //     {
    //       category: "Paquetes",
    //       actions: ["Envios", "Cotizar Envio"],
    //     },
    //   ],
    // };

    // const roleDataLicenciatario = {
    //   role_name: "LICENCIATARIO_TRADICIONAL",
    //   has_wallet: true,
    //   type: "LICENCIATARIO",
    //   permissions: [
    //     {
    //       category: "Gestion Administrativa",
    //       actions: ["Cortes de Caja", "Dashboard General"],
    //     },
    //     {
    //       category: "Licenciatarios",
    //       actions: [
    //         "Dashboard de Inversor",
    //         "Solicitudes de Cancelacion",
    //         "Pago de Servicios",
    //         "Caja",
    //         "Resumen",
    //       ],
    //     },
    //     {
    //       category: "Paquetes",
    //       actions: ["Empaques", "Envios", "Cotizar Envio"],
    //     },
    //   ],
    // };

    // const roleDataCajero = {
    //   role_name: "CAJERO",
    //   has_wallet: true,
    //   type: "CAJERO",
    //   permissions: [
    //     {
    //       category: "Licenciatarios",
    //       actions: ["Caja", "Resumen"],
    //     },
    //     {
    //       category: "Paquetes",
    //       actions: ["Empaques", "Envios", "Cotizar Envio"],
    //     },
    //   ],
    // };
    // const WarehouseNew = new WarehouseModel(Warehouse);
   //const repartidor = new Roles(roleRepartidor);
    // const upsServices = new Service(upsData);
    // const role = new Roles(roleData);
    //const roleLicenciatario = new Roles(roleDataLicenciatario);
    //const roleCajero = new Roles(roleDataCajero);
    //const rolePendienteCreate = new Roles(rolePendiente);
    // const fedex = new Service(fedexData);
    //const superenvios = new Service(superenviosData);
    // const paqueteExpress = new Service(paqueteExpressData);
    //const dhl = new Service(dhlData);
    /// const estafeta = new Service(estafetaData);
    const turboEnviosServices = new Service(turboEnvios);
    //const roleClienteCorporativo = new Roles(RoleClienteCorporativo);
    // await roleLicenciatario.save();
    // await roleCajero.save();
    //  await role.save();
    // await fedex.save();
    //await superenvios.save();
    // await paqueteExpress.save();
    // await dhl.save();
    //await estafeta.save();
    // await upsServices.save();
    // await rolePendienteCreate.save();
    // await roleClienteCorporativo.save();
  //  await repartidor.save();
    // await WarehouseNew.save();
    // const t1Envios = new Service(t1EnviosData);
    // await t1Envios.save();
    await turboEnviosServices.save();
    console.log("Database initialized with updated data from API response");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

module.exports = initializeDatabase;
