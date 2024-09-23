const express = require("express");
const router = express.Router();
const LogLockerController = require("../controllers/LogLockersController");
const LockerController = require("../controllers/LockerControllerCrud");
// const MqttController = require("../controllers/lockerController");
// const mqttController = new MqttController();
// router.post("/", mqttController.handleRequest.bind(mqttController));
router.post("/create", async (req, res) => {
  LockerController.createLocker(req, res);
});
router.get("/list", async (req, res) => {
  LockerController.listLockers(req, res);
});

router.post("/login", async (req, res) => {
  LogLockerController.login(req, res);
});

router.post("/signup", async (req, res) => {
  LogLockerController.create(req, res);
});

router.post("/verifyToken", async (req, res) => {
  LogLockerController.verifyToken(req, res);
});

module.exports = router;
