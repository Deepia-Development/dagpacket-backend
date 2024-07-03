const UserPackingController = require('../controllers/UserPackingController');
const { isAdmin } = require('../middlewares/AdminAuth');
const router = require('express').Router();


router.post('/restock', isAdmin, async (req, res) => {
    UserPackingController.restockUserInventory(req, res);
})

router.get('/inventory/:user_id', async (req, res) => {
    UserPackingController.getUserInventory(req, res);
})

module.exports = router;