const express = require("express");
const router = express.Router();
const LockerTransactionsController = require("../../controllers/lockers/locker-transactions-controller");


router.get("/:id/transactions", LockerTransactionsController.getLockerTransactions);
router.get("/:id/investments", LockerTransactionsController.getLockerInvestments);
router.post("/pay-transaction", LockerTransactionsController.payLockerTransaction);
router.get("/:id/non-shipment-transactions", LockerTransactionsController.getLockerNonShipmentTransactions);

module.exports = router;