// routes/shippingRoutes.js

const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.post('/quote', shippingController.getQuote);
router.post('/generate-guide', shippingController.generateGuide);
router.get('/track-guide/:tracking', shippingController.trackGuide);

module.exports = router;