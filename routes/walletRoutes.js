const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/walletController');

// Ruta para inicializar una wallet
router.post('/initialize', WalletController.initializeWallet);

// Ruta para obtener la wallet de un usuario
router.get('/:userId', WalletController.getWallet);

// Puedes agregar más rutas según sea necesario

module.exports = router;