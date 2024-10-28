const express = require('express');
const router = express.Router();
const estafetaController = require('../controllers/estafetaController')


router.post('/quote', estafetaController.getQuote);



module.exports = router;