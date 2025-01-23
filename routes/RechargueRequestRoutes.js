const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const rechargeRequestController = require('../controllers/RechargueRequestontroller');


router.post('/request', upload.single('proofImage'), rechargeRequestController.createRechargeRequest);
router.get('/requests', rechargeRequestController.getRechargeRequests);
router.post('/approve/:requestId', rechargeRequestController.approveRecharge);
router.post('/reject/:requestId', rechargeRequestController.rejectRecharge);
router.post('/add-funds', rechargeRequestController.addFunds);
router.get('/all/pending/count', rechargeRequestController.countPendingRechargeRequests);
router.get('/all/pending', rechargeRequestController.getPendingRechargeRequests);

module.exports = router;