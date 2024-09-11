const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');

// Middleware para validar los datos de entrada
const validateRegistrationData = (req, res, next) => {
  const { name, surname, email, password } = req.body;
  if (!name || !surname || !email || !password) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }  
  next();
};

const validateLoginData = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }
  next();
};

// Rutas
router.post('/register', validateRegistrationData, CustomerController.register);
router.post('/login', validateLoginData, CustomerController.login);

module.exports = router;