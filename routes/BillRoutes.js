const router = require('express').Router();
const BillController = require('../controllers/BillControler');

router.post('/create', BillController.createBill);

router.get('/get/:id', BillController.getBill);

router.get('/get/:id', BillController.getBillById);

router.put('/update/:id', BillController.updateBill);


router.delete('/delete/:id', BillController.deleteBill);

module.exports = router;

