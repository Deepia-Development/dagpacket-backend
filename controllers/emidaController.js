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
  
  exports.doRecharge = async (req, res) => {
    try {
      const { productId, accountId, amount } = req.body;
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

exports.lookupTransaction = async (req, res) => {
  const { invoiceNo } = req.params;

  try {
    const result = await emidaService.lookupTransaction(invoiceNo);
    res.json(result);
  } catch (error) {
    console.error('Error looking up transaction:', error);
    res.status(500).json({ error: 'Error looking up transaction', message: error.message });
  }
};

  
  exports.getAccountBalance = async (req, res) => {
    try {
      const accountBalance = await emidaService.getAccountBalance();
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