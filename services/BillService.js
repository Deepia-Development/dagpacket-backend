const BillModel = require("../models/BillModel");
const Config = require("../config/config");
const ShipmentModel = require("../models/ShipmentsModel");
const token = btoa(`${Config.facturama.username}:${Config.facturama.password}`);
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const User = require("../models/UsersModel");
async function createBill(req) {
  try {
    const { shipment_id, id, data } = req.body;

    if (!id) {
      return errorResponse("El id del usuario es requerido");
    }

    if (!shipment_id) {
      return errorResponse("Faltan campos requeridos");
    }

    // Validar que el usuario exista
    const user = await User.findById(id);

    if (!user) {
      return errorResponse("Usuario no encontrado");
    }

    // Validar que el envío exista
    const shipment = await ShipmentModel.findById(shipment_id);
    if (!shipment) {
      return errorResponse("El envío no existe");
    }

    const billExists = await BillModel.findOne({
      shipment_ids: shipment_id,
    });

    if (billExists) {
      return errorResponse("Ya existe una factura para este envío");
    }

    // Construir el cuerpo de la factura
    const billBody = await buildBody(data);
    console.log("TOken de autenticación:", token);
    // console.log("Cuerpo de la factura:", JSON.stringify(billBody, null, 2));
    const response = await fetch(`${Config.facturama.baseUrl}/3/cfdis`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(billBody),
    });

    console.log("Respuesta de la API:", response.status, response);

    if (!response.ok) {
      return errorResponse("Error al crear la factura: " + response.statusText);
    }

    const location = response.headers.get("Location"); // Obtiene la URL completa
    const parts = location.split("/"); // Divide por '/'
    const lastId = parts[parts.length - 1]; // Toma el último elemento

    const bill = new BillModel({
      generated_by: id,
      shipment_ids: [shipment_id],
      status: true,
      reference: lastId, // Aquí pones solo el ID
    });

    const savedBill = await bill.save();

    if (savedBill) {
      return dataResponse("Factura creada exitosamente", savedBill);
    }

    return errorResponse("No se pudo crear la factura");
  } catch (error) {
    console.error("Error al crear la factura:", error);
    return errorResponse(
      "Ocurrió un error al crear la factura: " + error.message
    );
  }
}

async function verifyBillExists(shipment_id) {
  try {
    const bill = await BillModel.findOne({ shipment_ids: shipment_id });

    if (bill) {
      console.log("Factura encontrada:", bill);
      return dataResponse("Factura encontrada", bill);
    } else {
      console.log("No se encontró factura para el envío:", shipment_id);
      return errorResponse("No se encontró factura para el envío");
    }
  } catch (error) {
    console.error("Error al verificar la existencia de la factura:", error);
    return false;
  }
}

async function getBillInfoFacturama(req) {
  const { formato, id } = req.body;
  try {
    const response = await fetch(
      `${Config.facturama.baseUrl}/cfdi/${formato}/issued/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener la factura: " + response.statusText);
    }

    const data = await response.json();
    console.log("Datos de la factura:", data);
    return dataResponse("Factura obtenida exitosamente", data);
  } catch (error) {
    console.error("Error al obtener la factura:", error);
    throw error;
  }
};

// async function buildBody = (bill) => {
//   return {
//   "ExpeditionPlace": bill.ExpeditionPlace,
//   "CfdiType": "P",
//   "PaymentForm": bill.PaymentForm,
//   "PaymentMethod": bill.PaymentMethod,
//   "Issuer": {
//     "FiscalRegime": "601", // Added required field
//     "Rfc": "DAG2006155W0",
//     "Name": "DAGPACKET SAPI DE C.V."
//   },
//   "Receiver": {
//     "Rfc": "GACY961019NHA",
//     "Name": "YASMIN GARCIA CARBAJAL",
//     "CfdiUse": "D01",
//     "FiscalRegime": "605",    // Added required field
//     "TaxZipCode": "45654"     // Added required field
//   },
//   "Items": [
//     {
//       "ProductCode": "10101504",
//       "IdentificationNumber": "EDL",
//       "Description": "Estudios de laboratorio",
//       "Unit": "NO APLICA",
//       "UnitCode": "MTS",
//       "UnitPrice": 0.01,
//       "Quantity": 1.0,
//       "Subtotal": 0.01,
//       "TaxObject": "02", // <-- agregado
//       "Taxes": [
//         {
//           "Total": 0.0,
//           "Name": "IVA",
// "Base": 0.01, // <-- corregido          "Rate": 0.16,
//           "IsRetention": true
//         }
//       ],
//       "Total": 0.01
//     },
//     {
//       "ProductCode": "10101504",
//       "IdentificationNumber": "001",
//       "Description": "SERVICIO DE COLOCACION",
//       "Unit": "NO APLICA",
//       "UnitCode": "E49",
//       "UnitPrice": 100.0,
//       "Quantity": 15.0,
//       "Subtotal": 1500.0,
//       "TaxObject": "02", // <-- agregado
//       "Discount": 0.0,
//       "Taxes": [
//         {
//           "Total": 240.0,
//           "Name": "IVA",
//           "Base": 1500.0,
//           "Rate": 0.16,
//           "IsRetention": false
//         }
//       ],
//       "Total": 1740.0
//     }
//   ]
// }
// };

const buildBody = async (bill) => {
  const quantity = parseFloat(bill.Quantity || 1.0);
  const unitPrice = parseFloat(bill.UnitPrice || 0.01);

  const subtotal = parseFloat((quantity * unitPrice).toFixed(2));
  const taxRate = 0.16;
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  return {
    ExpeditionPlace: bill.ExpeditionPlace,
    CfdiType: "I",
    PaymentForm: bill.PaymentForm,
    PaymentMethod: bill.PaymentMethod,
    Issuer: {
      FiscalRegime: "626",
      Rfc: "CACW041231GK6",
      Name: "WILBERTH ANTONY CAHUICH CRUZ",
    },
    Receiver: {
      Rfc: bill.ReceiverRfc,
      Name: bill.ReceiverName,
      FiscalRegime: bill.FiscalRegime,
      TaxZipCode: bill.TaxZipCode,
    },
    Items: [
      {
        ProductCode: bill.ProductCode || "10101504",
        IdentificationNumber: bill.IdentificationNumber || "EDL",
        Description: bill.Description,
        Unit: bill.NameUnit || "NO APLICA",
        UnitCode: bill.UnitCode || "NOA",
        UnitPrice: unitPrice,
        Quantity: quantity,
        Subtotal: subtotal,
        TaxObject: "02",
        Taxes: [
          {
            Total: tax,
            Name: "IVA",
            Base: subtotal,
            Rate: taxRate,
            IsRetention: false,
          },
        ],
        Total: total,
      },
    ],
  };
};

module.exports = {
  createBill,
getBillInfoFacturama,
  verifyBillExists,
};
