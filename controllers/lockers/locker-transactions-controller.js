const LockersServiceTransactions = require("../../services/lockers/lockers-service-transactions");


class LockerTransactionsController {

    async getLockerTransactions(req, res) {
        try {
            const transactions = await LockersServiceTransactions.getLockerTransactions(req);
            res.json(transactions);
        } catch (error) {
            console.error("Error fetching locker transactions:", error);
            res.status(500).json({ error: "Error fetching locker transactions" });
        }
    }

    async getLockerInvestments(req, res) {
        try {
            const investments = await LockersServiceTransactions.getLockerInvestments(req);
            res.json(investments);
        } catch (error) {
            console.error("Error fetching locker investments:", error);
            res.status(500).json({ error: "Error fetching locker investments" });
        }
    }


    async payLockerTransaction(req, res) {
        try {
            const result = await LockersServiceTransactions.payLockerTransaction(req);
            res.json(result);
        } catch (error) {
            console.error("Error processing locker transaction:", error);
            res.status(500).json({ error: "Error processing locker transaction" });
        }
    }

    async getLockerNonShipmentTransactions(req, res) {
        try {
            const transactions = await LockersServiceTransactions.getLockerNonShipmentTransactions(req);
            res.json(transactions);
        } catch (error) {
            console.error("Error fetching locker non-shipment transactions:", error);
            res.status(500).json({ error: "Error fetching locker non-shipment transactions" });
        }
    }

}

module.exports = new LockerTransactionsController();