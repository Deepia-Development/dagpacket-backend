const express = require('express');
const router = express.Router();
const MqttController = require('../controllers/lockerController');

const mqttController = new MqttController();

router.post('/', mqttController.handleRequest.bind(mqttController));

module.exports = router;