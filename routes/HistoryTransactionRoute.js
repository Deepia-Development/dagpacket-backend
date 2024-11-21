const router = require("express").Router();

const HistoryTransactionController = require("../controllers/HistoryTransacctionController");

router.get("/list", async (req, res) => {
  HistoryTransactionController.listTransactions(req, res);
});

router.get("/list-by-type", async (req, res) => {
  HistoryTransactionController.listTransactionsByType(req, res);
});

router.get("/user/:id", async (req, res) => {
  HistoryTransactionController.getTransactionByUser(req, res);
});

router.get("/quincenal-profit", async (req, res) => {
  HistoryTransactionController.getQuincenalProfit(req, res);
});

module.exports = router;
