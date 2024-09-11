
const express = require('express');
const router = express.Router();
const dhlController = require('../controllers/pluginController');

router.post('/quote', dhlController.getQuote);
router.post('/generate-guide', dhlController.generateGuide);

module.exports = router;