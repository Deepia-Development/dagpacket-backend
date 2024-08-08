const express = require('express');
const router = express.Router();
const fedexController = require('../controllers/fedexController');

router.post('/quote', fedexController.getQuote);

module.exports = router;