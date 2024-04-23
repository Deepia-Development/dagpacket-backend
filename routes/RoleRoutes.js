const RoleController = require('../controllers/RoleController');
const router = require('express').Router();


router.post('/create', async (req, res) => {
    RoleController.create(req, res);
})

router.get('/roles', async (req, res) => {
    RoleController.listRoles(req, res);
})

module.exports = router;