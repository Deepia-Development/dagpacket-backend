const ShipmentController = require("../controllers/ShipmentsController");
const { isAdmin } = require("../middlewares/AdminAuth");
const router = require("express").Router();

router.post("/create/:userId", async (req, res) => {
  ShipmentController.create(req, res);
});

router.post("/add-to-cart/:id", async (req, res) => {
  ShipmentController.addShipmentToCart(req, res);
});

router.patch("/remove-to-cart/:id", async (req, res) => {
  ShipmentController.removeShipmentToCart(req, res);
});

router.post("/create-customer/:userId", async (req, res) => {
  ShipmentController.createCustomer(req, res);
});

router.get("/tracking/:tracking", async (req, res) => {
  ShipmentController.getByTrackingNumber(req, res);
});

router.post("/request-code/:id", async (req, res) => {
  ShipmentController.requestCodeForActionGaveta(req, res);
});

router.post("/validate-code/:id", async (req, res) => {
  ShipmentController.validateCodeForActionGaveta(req, res);
});


router.post("/validate-dimensions/:id", async (req, res) => {
  ShipmentController.validateDimentions(req, res);
});

router.post("/create-locker", async (req, res) => {
  ShipmentController.createLockerShipment(req, res);
});

router.post("/pay-locker", async (req, res) => {
  ShipmentController.payShipmentLocker(req, res);
});

router.get("/get-shipments-by-locker/:locker_id", async (req, res) => {
  ShipmentController.getShipmentsByLocker(req, res);
});

router.patch("/update/:id", async (req, res) => {
  ShipmentController.update(req, res);
});

router.get("/profit/:id", async (req, res) => {
  ShipmentController.shipmentProfit(req, res);
});

router.get("/list-shipments/:id", async (req, res) => {
  ShipmentController.getUserShipments(req, res);
});



router.get("/global-profit", isAdmin, async (req, res) => {
  ShipmentController.globalProfit(req, res);
});

router.get("/all-shipments", isAdmin, async (req, res) => {
  ShipmentController.getAllShipments(req, res);
});

router.patch("/pay", async (req, res) => {
  ShipmentController.payShipment(req, res);
});

router.get("/pending/:id", async (req, res) => {
  ShipmentController.pendingShipment(req, res);
});

router.get("/pending-shipments/:id", async (req, res) => {
  ShipmentController.userPendingShipmentsNotInCar(req, res);
});

router.get("/user-shipments/:user_id", async (req, res) => {
  ShipmentController.userShipments(req, res);
});

router.get("/details/:id", async (req, res) => {
  ShipmentController.detailsShipment(req, res);
});

router.get("/packing-profit/:id", async (req, res) => {
  ShipmentController.getProfitPacking(req, res);
});

router.patch("/save-guide/:id", async (req, res) => {
  ShipmentController.saveGuide(req, res);
});

router.delete("/:id", ShipmentController.deleteShipment);
router.get("/quincenal-profit", ShipmentController.quincenalProfitController);

router.get("/shipment-paid", async (req, res) => {
  ShipmentController.getAllShipmentsPaid(req, res);
});

module.exports = router;
