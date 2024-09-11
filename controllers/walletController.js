const WalletService = require('../services/walletService');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

class WalletController {
    static async initializeWallet(req, res) {
        try {
          const { userId } = req.body;
          if (!userId) {
            return res.status(400).json(errorResponse('User ID is required'));
          }
    
          const wallet = await WalletService.initializeWallet(userId);
          res.status(200).json(dataResponse('Wallet initialized successfully', wallet));
        } catch (error) {
          console.error('Error in wallet initialization:', error);
          if (error.message === 'User already has a wallet') {
            return res.status(400).json(errorResponse(error.message));
          }
          res.status(500).json(errorResponse('Internal server error'));
        }
      }
    
      static async getWallet(req, res) {
        try {
          const { userId } = req.params;
          const wallet = await WalletService.getWallet(userId);
          res.status(200).json(dataResponse('Wallet retrieved successfully', wallet));
        } catch (error) {
          console.error('Error getting wallet:', error);
          if (error.message === 'Wallet not found for this user') {
            return res.status(404).json(errorResponse(error.message));
          }
          res.status(500).json(errorResponse('Internal server error'));
        }
      }
  
}

module.exports = WalletController;