const UserPackingController = require('../controllers/UserPackingController');
const { isAdmin } = require('../middlewares/AdminAuth');
const router = require('express').Router();


router.post('/restock', isAdmin, async (req, res) => {
    UserPackingController.restockUserInventory(req, res);
})

module.exports = router;