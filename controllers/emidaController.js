const emidaService = require('../services/emidaService');

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
    const { productId, accountId, amount } = req.body;
    if (!productId || !accountId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const invoiceNo = Date.now().toString(); // Genera un número de factura único

    const result = await emidaService.recharge(productId, accountId, amount, invoiceNo);
    
    res.json(result);
  } catch (error) {
    console.error('Error in doRecharge controller:', error);
    res.status(500).json({ 
      error: 'Error performing recharge', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.doBillPayment = async (req, res) => {
  try {
    const { productId, accountId, amount } = req.body;
    if (!productId || !accountId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const invoiceNo = Date.now().toString(); // Genera un número de factura único

    const result = await emidaService.billPayment(productId, accountId, amount, invoiceNo);
    
    res.json(result);
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