const express = require('express');
const scanController = require('../controllers/scanController');

const router = express.Router();


router.get('/scans', scanController.getAllScans);


router.put('/scans/:id', scanController.updateBarcode);

module.exports = router;
