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

router.get("/listWithPackage", LockerController.listLockerWithPackage);
router.get("/list", async (req, res) => {
  LockerController.listLockers(req, res);
});

router.get("/:id", async (req, res) => {
  LockerController.getLockerById(req, res);
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

router.get("/user/:id", async (req, res) => {
  LogLockerController.getUserLockerById(req, res);
});

router.patch("/generateNewPassword", async (req, res) => {
  LogLockerController.generateNewPassword(req, res);
});

router.patch("/status/:id", async (req, res) => {
  LockerController.updateStatusLocker(req, res);
});

router.patch("/edit/:id", async (req, res) => {
  LogLockerController.editUserInfo(req, res);
});

router.post("/status/", async (req, res) => {
  LockerController.getLockerStatus(req, res);
});

router.patch("/update/:id", async (req, res) => {
  LogLockerController.updateLocker(req, res);
});

module.exports = router;
