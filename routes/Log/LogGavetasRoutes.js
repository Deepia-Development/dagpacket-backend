const express = require("express");
const router = express.Router();
const LogGavetaController = require('../../controllers/Log/LogGavetaController')

router.post('/gaveta-log', async (req, res) => {
    LogGavetaController.createLogGaveta(req, res);
})


router.get('/list', async (req, res) => {
    LogGavetaController.getLogGavetas(req, res);
})


module.exports = router;