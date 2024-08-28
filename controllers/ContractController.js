const ContractService = require('../services/ContractService');

class ContractController {
  async createContract(req, res) {
    try {
      const { userId, contractType } = req.body;
      const result = await ContractService.createContract(userId, contractType);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      console.error('Error en el controlador de creación de contrato:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async getContract(req, res) {
    try {
      const { userId } = req.params;
      const result = await ContractService.getContractByUserId(userId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error('Error en el controlador de obtención de contrato:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async updateContract(req, res) {
    try {
      const { userId } = req.params;
      const { contractType } = req.body;
      const result = await ContractService.updateContract(userId, contractType);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error en el controlador de actualización de contrato:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}

module.exports = new ContractController();