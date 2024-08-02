const express = require('express');
const router = express.Router();
const addressController = require('../controllers/AddressController');

router.post('/', addressController.createAddress);
router.get('/user', addressController.getAddressesByUser);
router.get('/all', addressController.getAllAddresses);

module.exports = router;