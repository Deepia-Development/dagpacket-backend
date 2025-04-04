const ShipmentService = require("../services/ShipmentService");

async function create(req, res) {
  try {
    const Shipment = await ShipmentService.createShipment(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function removeShipmentToCart(req, res) {
  try {
    const Shipment = await ShipmentService.removeShipmentToCar(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

async function userPendingShipmentsNotInCar(req,res){
  try{
    const User = await ShipmentService.userPendingShipmentsNotInCar(req,res);
    res.status(200).json(User);
  }catch(error){
    res.status(400).json({ message: error.message });
  }
}

async function addShipmentToCart(req, res) {
  try {
    const Shipment = await ShipmentService.addShipmentToCar(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function requestCodeForActionGaveta(req, res) {
  try {
    const Shipment = await ShipmentService.requestCodeForActionGaveta(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function validateDimentions(req, res) {
  try {
    const Shipment = await ShipmentService.validateDimentions(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function validateCodeForActionGaveta(req, res) {
  try {
    const Shipment = await ShipmentService.validateCodeForActionGaveta(
      req,
      res
    );
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function createLockerShipment(req, res) {
  try {
    const Shipment = await ShipmentService.createLockerShipment(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function payShipmentLocker(req, res) {
  try {
    const Shipment = await ShipmentService.payLockerShipment(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getShipmentsByLocker(req, res) {
  try {
    const Shipment = await ShipmentService.getShipmentsByLocker(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getByTrackingNumber(req, res) {
  try {
    const Shipment = await ShipmentService.getShipmentByTracking(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function update(req, res) {
  try {
    const Shipment = await ShipmentService.updateShipment(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function shipmentProfitAll(req, res) {
  try {
    const Shipment = await ShipmentService.shipmentProfitByFortnight(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function shipmentProfit(req, res) {
  try {
    const Shipment = await ShipmentService.shipmentProfit(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function createCustomer(req, res) {
  try {
    const customer = await ShipmentService.createShipmentCustomer(req);
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getUserShipments(req, res) {
  try {
    const shipmentResponse = await ShipmentService.getUserShipments(req);

    if (shipmentResponse.success) {
      res.status(200).json(shipmentResponse);
    } else {
      res.status(404).json(shipmentResponse);
    }
  } catch (error) {
    console.error("Error en getUserShipments:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener los envíos del usuario",
    });
  }
}




async function getAllShipments(req, res) {
  try {
    const shipmentResponse = await ShipmentService.getAllShipments(req);

    if (shipmentResponse.success) {
      res.status(200).json(shipmentResponse);
    } else {
      res.status(404).json(shipmentResponse);
    }
  } catch (error) {
    console.error("Error en getAllShipments:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener todos los envíos",
    });
  }
}

async function getAllShipmentsPaid(req, res) {
  try {
    const shipmentResponse = await ShipmentService.getShipmentPaid(req);

    if (shipmentResponse.success) {
      res.status(200).json(shipmentResponse);
    } else {
      res.status(404).json(shipmentResponse);
    }
  } catch (error) {
    console.error("Error en getAllShipmentsPaid:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener todos los envíos",
    });
  }
}

async function globalProfit(req, res) {
  try {
    const Shipment = await ShipmentService.globalProfit(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function payShipment(req, res) {
  try {
    const Shipment = await ShipmentService.payShipments(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function pendingShipment(req, res) {
  try {
    const Shipment = await ShipmentService.userPendingShipments(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function userShipments(req, res) {
  try {
    const Shipment = await ShipmentService.userShipments(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function detailsShipment(req, res) {
  try {
    const Shipment = await ShipmentService.detailShipment(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getProfitPacking(req, res) {
  try {
    const Shipment = await ShipmentService.getProfitPacking(req, res);
    res.status(200).json(Shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function saveGuide(req, res) {
  try {
    const result = await ShipmentService.saveGuide(req);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteShipment(req, res) {
  try {
    const result = await ShipmentService.deleteShipment(req);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error no manejado en deleteShipment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
}

async function quincenalProfitController(req, res) {
  try {
    const { userId, year, month, quincena } = req.query;
    // Validación básica de los parámetros
    if (!userId || !year || !month || !quincena) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan parámetros requeridos" });
    }
    // Validar que el año, mes y quincena sean números válidos
    if (isNaN(year) || isNaN(month) || isNaN(quincena)) {
      return res.status(400).json({
        success: false,
        message: "Año, mes y quincena deben ser números",
      });
    }
    // Validar rango del mes y quincena
    if (month < 1 || month > 12 || quincena < 1 || quincena > 2) {
      return res
        .status(400)
        .json({ success: false, message: "Mes o quincena fuera de rango" });
    }

    const result = await ShipmentService.getQuincenalProfit({
      query: { userId, year, month, quincena },
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error en quincenalProfitController:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

module.exports = {
  create,
  shipmentProfit,
  getUserShipments,
  globalProfit,
  getAllShipments,
  payShipment,
  pendingShipment,
  userShipments,
  detailsShipment,
  getProfitPacking,
  saveGuide,
  deleteShipment,
  quincenalProfitController,
  update,
  createCustomer,
  getAllShipmentsPaid,
  getByTrackingNumber,
  createLockerShipment,
  getShipmentsByLocker,
  payShipmentLocker,
  requestCodeForActionGaveta,
  validateCodeForActionGaveta,
  validateDimentions,
  addShipmentToCart,
  removeShipmentToCart,
  userPendingShipmentsNotInCar
};
