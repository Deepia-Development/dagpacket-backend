const ShipmentController = require('../controllers/ShipmentsController');
const { isAdmin } = require('../middlewares/AdminAuth')
const router = require('express').Router();

router.post('/create', async (req, res) => {
    ShipmentController.create(req, res);
});

router.get('/profit/:id', async (req, res) =>{
    ShipmentController.shipmentProfit(req, res);
});

router.get('/list-shipments/:id', async (req, res) =>{
    ShipmentController.getUserShipments(req, res);
});

router.get('/global-profit', isAdmin, async (req, res) => {
  ShipmentController.globalProfit(req, res);
});

router.get('/all-shipments', isAdmin, async (req, res) =>{
    ShipmentController.getAllShipments(req, res);
})

router.patch('/shipment/:id/pay', async (req, res) => {
    ShipmentController.payShipment(req, res);
})

router.get('/pending/:id', async (req, res) =>{
    ShipmentController.pendingShipment(req, res);
})


module.exports = router;

