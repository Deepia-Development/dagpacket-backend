const router = require('express').Router();
const BillController = require('../controllers/BillController');

router.post('/create', BillController.createBill);
router.get('/verify/:id', BillController.verifyBill);
router.post('/get', BillController.getBillInfoFacturama);


module.exports = router;

