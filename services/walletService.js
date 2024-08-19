const Wallet = require('../models/WalletsModel');

class WalletService {
  static async initializeWallet(userId) {
    try {
      const newWallet = new Wallet({
        user: userId,
        sendBalance: 0.0,
        rechargeBalance: 0.0,
        servicesBalance: 0.0
      });

      const savedWallet = await newWallet.save();
      return savedWallet;
    } catch (error) {
      throw new Error(`Error initializing wallet: ${error.message}`);
    }
  }
}

module.exports = WalletService;