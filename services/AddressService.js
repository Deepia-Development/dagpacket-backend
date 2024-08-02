const Address = require('../models/AddressModel');

const addressService = {
  async createAddress(addressData) {
    try {
      const newAddress = new Address(addressData);
      return await newAddress.save();
    } catch (error) {
      throw error;
    }
  },

  async getAddressesByUser(userId) {
    try {
      return await Address.find({ user: userId });
    } catch (error) {
      throw error;
    }
  },

  async getAllAddresses() {
    try {
      return await Address.find().populate('user', 'name email');
    } catch (error) {
      throw error;
    }
  }
};

module.exports = addressService;