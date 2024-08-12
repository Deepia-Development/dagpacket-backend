// routes/shippingRoutes.js

const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.post('/quote', shippingController.getQuote);
router.post('/create', shippingController.createShipment);
router.post('/generate-guide', shippingController.generateGuide);

module.exports = router;