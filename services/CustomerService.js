const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Customer = require('../models/CustomerModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

class CustomerService {
  async register(customerData) {
    try {
      const { email, password } = customerData;

      // Verificar si el usuario ya existe
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return errorResponse('El correo electrónico ya está registrado');
      }

      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Crear nuevo cliente
      const newCustomer = new Customer({
        ...customerData,
        password: hashedPassword
      });

      await newCustomer.save();

      return successResponse('Usuario registrado exitosamente');
    } catch (error) {
      console.error('Error en el registro:', error);
      return errorResponse('Error en el registro del usuario');
    }
  }

  async login(email, password) {
    try {
      // Buscar al cliente por email
      const customer = await Customer.findOne({ email });
      if (!customer) {
        return errorResponse('Credenciales inválidas');
      }

      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (!isPasswordValid) {
        return errorResponse('Credenciales inválidas');
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: customer._id, email: customer.email },
        process.env.TOKEN,
        { expiresIn: '1h' }
      );

      return dataResponse('Inicio de sesión exitoso', { token });
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      return errorResponse('Error en el inicio de sesión');
    }
  }
}

module.exports = new CustomerService();