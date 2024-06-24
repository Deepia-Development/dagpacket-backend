const UserPackingService = require('../services/UserPackingService');

async function restockUserInventory (req, res) {
    try {
        const UserPacking = await UserPackingService.restockUserInventory(req, res);
        res.status(200).json(UserPacking);
    } catch (error) {
        res.status(400).json({ message: error.message});
    }
}

module.exports = {
    restockUserInventory
}