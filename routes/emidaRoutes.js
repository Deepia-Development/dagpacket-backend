const express = require('express');
const router = express.Router();
const emidaController = require('../controllers/emidaController');

// Middleware para validar el tipo de servicio
const validateServiceType = (req, res, next) => {
  const { type } = req.query;
  if (type && type !== 'recharge' && type !== 'payment') {
    return res.status(400).json({ error: 'Invalid service type. Must be "recharge" or "payment".' });
  }
  next();
};

// Rutas de recarga
router.get('/products', emidaController.getProducts);
router.post('/recharge', emidaController.doRecharge);
router.post('/create-comission', emidaController.createComission);
router.put('/update-comission', emidaController.updateComission);
router.delete('/delete-comission/:id', emidaController.deleteComission);
router.get('/comissions', emidaController.getComissions); 
// Rutas de pago de servicios
router.get('/payment-services', emidaController.getPaymentServices);
router.post('/bill-payment', emidaController.doBillPayment);

// Rutas comunes
router.get('/transaction/:invoiceNo', validateServiceType, emidaController.lookupTransaction);
router.get('/account-balance', validateServiceType, emidaController.getAccountBalance);

module.exports = router;