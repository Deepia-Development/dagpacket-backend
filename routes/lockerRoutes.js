const express = require("express");
const router = express.Router();
const LockerController = require("../controllers/LockerControllerCrud");
// const MqttController = require("../controllers/lockerController");
// const mqttController = new MqttController();
// router.post("/", mqttController.handleRequest.bind(mqttController));
router.post("/create", async (req,res)=>{
    LockerController.createLocker(req,res);
});
router.get("/list", async (req,res)=>{
    LockerController.listLockers(req,res);
});

module.exports = router;
