const TransactionHistoryService = require('../services/HistoryTransactionService');


const listTransactions = async (req, res) => {
    try {
        const transactions = await TransactionHistoryService.getAll();
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getTransactionByUser = async (req, res) => {
    try {
        const transaction = await TransactionHistoryService.getByUser(req);
        if (transaction) {
            res.status(200).json(transaction);
        } else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    listTransactions,
    getTransactionByUser
};