const express = require('express');
const router = express.Router();
const TerminalController = require('../controllers/TerminalController');

// Crear nueva terminal
router.post('/', TerminalController.createTerminal);

// Obtener todas las terminales
router.get('/', TerminalController.getAllTerminals);

// Obtener terminales con paginación
router.get('/paginated', TerminalController.getTerminalsPaginated);

// Obtener terminal por ID
router.get('/id/:id', TerminalController.getTerminalById);

// Obtener terminal por número de serie
router.get('/sn/:sn', TerminalController.getTerminalBySN);

// Obtener terminal por IP
router.get('/ip/:ip', TerminalController.getTerminalByIP);

// Obtener terminales por locker ID
router.get('/locker/:lockerId', TerminalController.getTerminalsByLockerId);

// Actualizar terminal completa
router.put('/:id', TerminalController.updateTerminal);

// Actualizar terminal parcial
router.patch('/:id', TerminalController.patchTerminal);

// Cambiar contraseña de terminal
router.patch('/:id/password', TerminalController.changeTerminalPassword);

// Eliminar terminal por ID
router.delete('/:id', TerminalController.deleteTerminal);

// Eliminar múltiples terminales
router.delete('/bulk', TerminalController.deleteMultipleTerminals);

// Verificar existencia por número de serie
router.get('/exists/sn/:sn', TerminalController.existsBySerialNumber);

// Verificar existencia por IP
router.get('/exists/ip/:ip', TerminalController.existsByIP);

// Contar total de terminales
router.get('/count', TerminalController.countTerminals);

module.exports = router;