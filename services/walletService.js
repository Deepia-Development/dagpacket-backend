const Wallet = require('../models/WalletsModel');
const User = require('../models/UsersModel'); // Asumiendo que tienes un modelo de Usuario

class WalletService {
  static async initializeWallet(userId) {
    try {
      // Verificar si el usuario ya tiene una wallet
      const existingWallet = await Wallet.findOne({ user: userId });
      if (existingWallet) {
        throw new Error('User already has a wallet');
      }

      const newWallet = new Wallet({
        user: userId,
        sendBalance: 0.0,
        rechargeBalance: 0.0,
        servicesBalance: 0.0
      });

      const savedWallet = await newWallet.save();

      // Actualizar el usuario con la referencia de la wallet
      await User.findByIdAndUpdate(userId, { wallet: savedWallet._id });

      return savedWallet;
    } catch (error) {
      throw new Error(`Error initializing wallet: ${error.message}`);
    }
  }

  static async getWallet(userId) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error('Wallet not found for this user');
      }
      return wallet;
    } catch (error) {
      throw new Error(`Error getting wallet: ${error.message}`);
    }
  }

  static async updateWalletBalance(userId, balanceType, amount) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error('Wallet not found for this user');
      }

      if (!['sendBalance', 'rechargeBalance', 'servicesBalance'].includes(balanceType)) {
        throw new Error('Invalid balance type');
      }

      wallet[balanceType] += amount;
      await wallet.save();

      return wallet;
    } catch (error) {
      throw new Error(`Error updating wallet balance: ${error.message}`);
    }
  }
}

module.exports = WalletService;