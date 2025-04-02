const emidaService = require("../services/emidaService");
const EmidaComission = require("../services/EmidaComission"); // Importa el modelo de comisiones para los servicios de emida
const services = require("../models/EmidaModel"); // Importa el modelo de servicios con comisiones

exports.getProducts = async (req, res) => {
  try {
    const products = await emidaService.getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error in getProducts controller:", error);
    res.status(500).json({
      error: "Error getting products",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.createComission = async (req, res) => {
  try {
    const { commission } = req.body;
    const comission = await EmidaComission.createService(commission);
    res.json(comission);
  } catch (error) {
    console.error("Error in createComission controller:", error);
    res.status(500).json({
      error: "Error creating comission",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}; // Crea una comisión para un servicio de emida

exports.updateComission = async (req, res) => {
  try {
 
    const response = await EmidaComission.updateService(req);
    res.json(response);
  } catch (error) {
    console.error("Error in updateComission controller:", error);
    res.status(500).json({
      error: "Error updating comission",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}; // Actualiza la comisión de un servicio de emida

exports.deleteComission = async (req, res) => {
  try {
    const { id } = req.params;
    const comission = await EmidaComission.deleteService(id);
    res.json(comission);
  } catch (error) {
    console.error("Error in deleteComission controller:", error);
    res.status(500).json({
      error: "Error deleting comission",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}; // Elimina la comisión de un servicio de emida

exports.getComissions = async (req, res) => {
  try {
    const comissions = await EmidaComission.getService();
    res.json(comissions);
  } catch (error) {
    console.error("Error in getComissions controller:", error);
    res.status(500).json({
      error: "Error getting comissions",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}; // Obtiene las comisiones de los servicios de emida

exports.getServices = async (req, res) => {};

exports.getPaymentServices = async (req, res) => {
  try {
    const paymentServices = await emidaService.getPaymentServices();
    res.json(paymentServices);
  } catch (error) {
    console.error("Error in getPaymentServices controller:", error);
    res.status(500).json({
      error: "Error getting payment services",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.doRecharge = async (req, res) => {
  try {
    const { productId, accountId, amount, id, paymentMethod,ProductName } = req.body;

    // Validación más robusta
    if (
      !productId ||
      !accountId ||
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      !id ||
      !paymentMethod
    ) {
      return res
        .status(400)
        .json({ error: "Campos requeridos faltantes o inválidos" });
    }

    // Simulación de errores
    if (productId === "PROVEEDOR_NO_DISPONIBLE") {
      return res.status(400).json({
        error: "Provider Error",
        message: "Proveedor no disponible. Intente más tarde.",
        responseCode: "16",
      });
    }

    if (productId === "XML_NOT_ACTIVATED") {
      return res.status(400).json({
        error: "XML NOT ACTIVATED",
        message: "Error con XML: Servicio no activado.",
        responseCode: "18",
      });
    }

    // const service = services.find(s => s.productId === productId);
    // console.log('Service:', service);
    // if (!service) {
    //   return res.status(404).json({
    //     error: 'INVALID PRODUCT-ID',
    //     message: 'Product is not assigned to this terminal.',
    //     responseCode: '51'
    //   });
    // }

    const invoiceNo = "1007";
    const result = await emidaService.recharge(
      productId,
      accountId,
      amount,
      id,
      paymentMethod,
      ProductName
    );

    if (result.error) {
      // Manejo de errores del servicio
      return res.status(400).json({
        error: result.error,
        message: result.message,
        responseCode: result.responseCode,
      });
    }

    // const commission = amount * service.commission;
    res.json({ result });
  } catch (error) {
    console.error("Error in doRecharge controller:", error);
    res.status(500).json({
      error: "Error performing recharge",
      message: error.message,
    });
  }
};

exports.doBillPayment = async (req, res) => {
  try {
    const { productId, accountId, amount, id, paymentMethod,ProductName } = req.body;
    if (!productId || !accountId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // const service = services.find(s => s.productId === productId);
    // if (!service) {
    //   return res.status(404).json({ error: 'Service not found' });
    // }

    console.log("Bill payment request:", req.body);

    const commission = amount * 1; // Calcula la comisión

    const totalAmount = parseFloat(amount); // Total con comisión

    console.log("Total amount:", totalAmount);
    console.log("Commission:", commission);

    const result = await emidaService.billPayment(
      productId,
      accountId,
      totalAmount,
      id,
      paymentMethod,
      ProductName
    );

    res.json({ result, commission }); // Devuelve el resultado junto con la comisión
  } catch (error) {
    console.error("Error in doBillPayment controller:", error);
    res.status(500).json({
      error: "Error performing bill payment",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.lookupTransaction = async (req, res) => {
  const { invoiceNo } = req.params;
  const { type } = req.query; // 'recharge' or 'payment'

  if (!invoiceNo) {
    return res.status(400).json({ error: "Invoice number is required" });
  }

  try {
    console.log("Looking up transaction:", invoiceNo);
    console.log("Type:", type);
    const result = await emidaService.lookupTransaction(
      invoiceNo,
      type === "payment"
    );
    if (!result) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error looking up transaction:", error);
    res.status(500).json({
      error: "Error looking up transaction",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.getAccountBalance = async (req, res) => {
  const { type } = req.query; // 'recharge' or 'payment'

  try {
    const accountBalance = await emidaService.getAccountBalance(
      type === "payment"
    );
    res.json(accountBalance);
  } catch (error) {
    console.error("Error in getAccountBalance controller:", error);
    res.status(500).json({
      error: "Error getting account balance",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
