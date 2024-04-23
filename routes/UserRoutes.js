const UserController = require('../controllers/UserCotroller');
const { isAdmin } = require('../middlewares/AdminAuth');
const router = require('express').Router();


router.post('/signup', async (req, res) => {
    UserController.create(req, res);
})

router.patch('/address/:id', async (req, res) => {
    UserController.addAddress(req, res);
})

router.post('/login', async (req, res) => {
    UserController.login(req, res);
})

router.get('/users', isAdmin, async (req, res) => {
    UserController.listUsers(req, res);
})

router.patch('/addpin/:id', async (req, res) => {
    UserController.addPin(req, res);
})

router.patch('/password/:id', async (req, res) => {
    UserController.changePassword(req, res);
})

router.patch('/update/:id', async (req, res) => {
    UserController.update(req, res);
})

router.patch('/role/:id', isAdmin, async (req, res) =>{
    UserController.addRole(req, res);
})

router.patch('/deactivate/:id', isAdmin, async (req, res) =>{
    UserController.deactivateAccount(req, res);
})

router.patch('/activate/:id', isAdmin, async (req, res) =>{
    UserController.activateAccount(req, res);
})

module.exports = router;

