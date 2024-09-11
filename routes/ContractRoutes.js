const express = require('express');
const router = express.Router();
const ContractController = require('../controllers/ContractController');

// Middleware para validar los datos de entrada
const validateContractData = (req, res, next) => {
  const { userId, contractType } = req.body;
  if (!userId || !contractType) {
    return res.status(400).json({ success: false, message: 'UserId y contractType son requeridos' });
  }
  if (!['INMEDIATA', 'TRADICIONAL'].includes(contractType)) {
    return res.status(400).json({ success: false, message: 'Tipo de contrato inválido' });
  }
  next();
};

// Rutas
router.post('/create', validateContractData, ContractController.createContract);
router.get('/:userId', ContractController.getContract);
router.put('/:userId', validateContractData, ContractController.updateContract);

module.exports = router;