const express = require('express');
const router = express.Router();
const estafetaController = require('../controllers/estafetaController')


router.post('/quote', estafetaController.getQuote);
router.post('/generate-guide', estafetaController.createShipment);



module.exports = router;