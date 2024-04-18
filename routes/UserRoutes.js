const UserController = require('../controllers/UserCotroller');
const router = require('express').Router();


router.post('/signup', async (req, res) =>{
    UserController.create(req, res);
})

router.patch('/address/:id', async (req, res) => {
    UserController.addAddress(req, res);
})

router.post('/login', async (req, res) => {
    UserController.login(req, res);
})

router.get('/users', async (req, res) => {
    UserController.listUsers(req, res);
})

module.exports = router;

