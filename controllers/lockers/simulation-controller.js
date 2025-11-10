const SimulationService = require("../../services/lockers/simulation-service");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../../helpers/ResponseHelper");

const simulationService = new SimulationService();

class SimulationController {
  // 📦 Obtener transacciones simuladas de inversión
  async getUserInvestmentTransactions(req, res) {
    try {
      const result = await simulationService.getUserInvestmentTransactions(req);
      return res.json(result);
    } catch (error) {
      console.error("Error en SimulationController.getUserInvestmentTransactions:", error);
      return res.status(500).json(errorResponse(error.message));
    }
  }

  // 💰 Obtener ganancias simuladas (Recargas y Pagos de Servicio)
  async getLockerServiceProfits(req, res) {
    try {
      const result = await simulationService.getLockerServiceProfits(req);
      return res.json(result);
    } catch (error) {
      console.error("Error en SimulationController.getLockerServiceProfits:", error);
      return res.status(500).json(errorResponse(error.message));
    }
  }
}

module.exports = new SimulationController();
