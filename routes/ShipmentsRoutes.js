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


module.exports = router;

