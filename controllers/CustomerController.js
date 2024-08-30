const CustomerService = require('../services/CustomerService');

class CustomerController {
  async register(req, res) {
    try {
      const result = await CustomerService.register(req.body);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      console.error('Error en el controlador de registro:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await CustomerService.login(email, password);
      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      console.error('Error en el controlador de inicio de sesión:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}

module.exports = new CustomerController();