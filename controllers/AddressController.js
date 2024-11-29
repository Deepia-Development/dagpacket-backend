const addressService = require('../services/AddressService');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper')

const addressController = {
  async createAddress(req, res) {
    try {
      const addressData = { ...req.body, user: req.user.user._id };
      const newAddress = await addressService.createAddress(addressData);
      res.json(await dataResponse('Dirección creada exitosamente', newAddress));
    } catch (error) {
      res.status(400).json(await errorResponse('Error al crear la dirección: ' + error.message));
    }
  },

  async getAddressesByUser(req, res) {
    try {
      const addresses = await addressService.getAddressesByUser(req.user.user._id);
      res.json(await dataResponse('Direcciones obtenidas exitosamente', addresses));
    } catch (error) {
      res.status(400).json(await errorResponse('Error al obtener las direcciones: ' + error.message));
    }
  },

  async getAddressByUserAndCp(req, res) {
    try {
      const address = await addressService.getAddressByUserAndCp(req.user.user._id, req.params.cp);
      res.json(await dataResponse('Dirección obtenida exitosamente', address));
    } catch (error) {
      res.status(400).json(await errorResponse('Error al obtener la dirección: ' + error.message));
    }
  },

  async getAllAddresses(req, res) {
    try {
      const addresses = await addressService.getAllAddresses();
      res.json(await dataResponse('Todas las direcciones obtenidas exitosamente', addresses));
    } catch (error) {
      res.status(400).json(await errorResponse('Error al obtener todas las direcciones: ' + error.message));
    }
  }
};

module.exports = addressController;