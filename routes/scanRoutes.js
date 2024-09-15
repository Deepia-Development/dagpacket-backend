
const express = require('express');
const scanController = require('../controllers/scanController');  

const router = express.Router();

router.get('/scans', scanController.getAllScans);

module.exports = router;