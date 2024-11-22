const RoleController = require('../controllers/RoleController');
const router = require('express').Router();


router.post('/create', async (req, res) => {
    RoleController.create(req, res);
})

router.get('/roles', async (req, res) => {
    RoleController.listRoles(req, res);
})

router.put('/update/:id', async (req, res) => {
    RoleController.update(req, res);
})

router.get('/role/:id', async (req, res) => {
    RoleController.getById(req, res);
})

router.get('/role-name/:role_name', async (req, res) => {
    RoleController.getByName(req, res);
})


router.put('/add-permission/:id', async (req, res) => {
    RoleController.addPermission(req, res);
})

module.exports = router;