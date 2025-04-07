const router = require("express").Router();

const HistoryTransactionController = require("../controllers/HistoryTransacctionController");
router.get("/list-by-type-all", async (req, res) => {
  HistoryTransactionController.listTransactionsByTypeAll(req, res);
});

router.get('/recipt/:id', async (req, res) => {
  HistoryTransactionController.getReciptById(req, res);
});

// router.get("/list", async (req, res) => {
//   HistoryTransactionController.listTransactions(req, res);
// });

router.get("/list-by-type", async (req, res) => {
  HistoryTransactionController.listTransactionsByType(req, res);
});

router.get("/:id", async (req, res) => {
  HistoryTransactionController.getTransactionById(req, res);
});

router.get("/user/:id", async (req, res) => {
  HistoryTransactionController.getTransactionByUser(req, res);
});

router.get("/quincenal-profit", async (req, res) => {
  HistoryTransactionController.getQuincenalProfit(req, res);
});
router.get("/quincenal-profit-services", async (req, res) => {
  HistoryTransactionController.getQuincenalProfitServicios(req, res);
});


module.exports = router;
