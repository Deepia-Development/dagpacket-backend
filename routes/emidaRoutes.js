const express = require('express');
const router = express.Router();
const emidaController = require('../controllers/emidaController');

router.get('/products', emidaController.getProducts);
router.post('/recharge', emidaController.recharge);
router.get('/transaction/:invoiceNo', emidaController.lookupTransaction);
router.get('/account-balance', emidaController.getAccountBalance);

module.exports = router;