const express = require("express");
const router = express.Router();
const SimulationController = require("../../controllers/lockers/simulation-controller");

// ✅ Simular transacciones de inversión por usuario
router.get(
  "/investment/:locker_id/:user_id/transactions",
  (req, res) => SimulationController.getUserInvestmentTransactions(req, res)
);

// ✅ Simular ganancias por servicios (Recarga / Pago de Servicio)
router.get(
  "/investment/:locker_id/:user_id/service-profits",
  (req, res) => SimulationController.getLockerServiceProfits(req, res)
);

module.exports = router;
