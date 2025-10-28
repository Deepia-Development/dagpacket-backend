const InvestmentsController = require("../../controllers/investments/InvestmentsController");
const express = require("express");
const router = express.Router();

router.get("/list", (req, res) => InvestmentsController.listInvestments(req, res));
router.get("/locker/:lockerId", (req, res) => InvestmentsController.listInvestmentsByLocker(req, res));
router.post("/invest", (req, res) => InvestmentsController.investInLocker(req, res));
router.get("/user/:user_id", (req, res) => InvestmentsController.listUserInvestments(req, res));

module.exports = router;