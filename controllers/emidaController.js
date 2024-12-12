const emidaService = require('../services/emidaService');
const services = require('../models/EmidaModel');  // Importa el modelo de servicios con comisiones

exports.getProducts = async (req, res) => {
  try {
    const products = await emidaService.getProducts();
    res.json(products);
  } catch (error) {
    console.error('Error in getProducts controller:', error);
    res.status(500).json({
      error: 'Error getting products',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getPaymentServices = async (req, res) => {
  try {
    const paymentServices = await emidaService.getPaymentServices();
    res.json(paymentServices);
  } catch (error) {
    console.error('Error in getPaymentServices controller:', error);
    res.status(500).json({
      error: 'Error getting payment services',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



exports.doRecharge = async (req, res) => {
  try {
    const { productId, accountId, amount, id, paymentMethod } = req.body;
    console.log('Recharge request:', req.body);

    // Validación más robusta
    if (!productId || !accountId || !amount || isNaN(amount) || amount <= 0 || !id || !paymentMethod) {
      return res.status(400).json({ error: 'Campos requeridos faltantes o inválidos' });
    }

    // Simulación de errores
    if (productId === 'PROVEEDOR_NO_DISPONIBLE') {
      return res.status(400).json({ 
        error: 'Provider Error', 
        message: 'Proveedor no disponible. Intente más tarde.', 
        responseCode: '16' 
      });
    }

    if (productId === 'XML_NOT_ACTIVATED') {
      return res.status(400).json({ 
        error: 'XML NOT ACTIVATED', 
        message: 'Error con XML: Servicio no activado.', 
        responseCode: '18' 
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

    const invoiceNo = '1007';
    const result = await emidaService.recharge(productId, accountId, amount, id, paymentMethod);

    if (result.error) {
      // Manejo de errores del servicio
      return res.status(400).json({ 
        error: result.error, 
        message: result.message, 
        responseCode: result.responseCode 
      });
    }

    // const commission = amount * service.commission;
    res.json({ result });

  } catch (error) {
    console.error('Error in doRecharge controller:', error);
    res.status(500).json({
      error: 'Error performing recharge',
      message: error.message
    });
  }
};




exports.doBillPayment = async (req, res) => {
  try {
    const { productId, accountId, amount, id,paymentMethod } = req.body;
    if (!productId || !accountId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // const service = services.find(s => s.productId === productId);
    // if (!service) {
    //   return res.status(404).json({ error: 'Service not found' });
    // }

    const commission = amount * 1;  // Calcula la comisión
    const totalAmount = parseFloat(amount) + parseFloat(commission);  // Total con comisión

    const invoiceNo = Date.now().toString();  // Genera un número de factura único
    const result = await emidaService.billPayment(productId, accountId, totalAmount, invoiceNo);

    res.json({ result, commission });  // Devuelve el resultado junto con la comisión
  } catch (error) {
    console.error('Error in doBillPayment controller:', error);
    res.status(500).json({
      error: 'Error performing bill payment',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


exports.lookupTransaction = async (req, res) => {
  const { invoiceNo } = req.params;
  const { type } = req.query; // 'recharge' or 'payment'


  if (!invoiceNo) {
    return res.status(400).json({ error: 'Invoice number is required' });
  }

  try {
    console.log('Looking up transaction:', invoiceNo);
    console.log('Type:', type);
    const result = await emidaService.lookupTransaction(invoiceNo, type === 'payment');
    if (!result) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error looking up transaction:', error);
    res.status(500).json({
      error: 'Error looking up transaction',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getAccountBalance = async (req, res) => {
  const { type } = req.query; // 'recharge' or 'payment'

  try {
    const accountBalance = await emidaService.getAccountBalance(type === 'payment');
    res.json(accountBalance);
  } catch (error) {
    console.error('Error in getAccountBalance controller:', error);
    res.status(500).json({
      error: 'Error getting account balance',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
