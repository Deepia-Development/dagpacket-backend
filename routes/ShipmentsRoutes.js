const ShipmentController = require('../controllers/ShipmentsController');
const { isAdmin } = require('../middlewares/AdminAuth')
const router = require('express').Router();

router.post('/create/:userId', async (req, res) => {
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

router.patch('/pay', async (req, res) => {
    ShipmentController.payShipment(req, res);
})

router.get('/pending/:id', async (req, res) =>{
    ShipmentController.pendingShipment(req, res);
})

router.get('/user-shipments/:user_id', async (req, res) =>{
    ShipmentController.userShipments(req, res);
})

router.get('/details/:id', async (req, res) => {
    ShipmentController.detailsShipment(req, res);
})

router.get('/packing-profit/:id', async (req, res) => {
    ShipmentController.getProfitPacking(req, res);
})

router.patch('/save-guide/:id', async (req, res) => {
    ShipmentController.saveGuide(req, res);
})

router.delete('/:id', ShipmentController.deleteShipment);
router.get('/quincenal-profit', ShipmentController.quincenalProfitController);


module.exports = router;

