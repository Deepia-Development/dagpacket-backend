const UserController = require('../controllers/UserController');
const { isAdmin } = require('../middlewares/AdminAuth');
const isValidPassword = require('../middlewares/PasswordCheck');
const router = require('express').Router();
const multer = require('multer');
const upload = multer();

router.post('/request-reset', UserController.requestReset);
router.post('/reset-password', UserController.resetPassword);

router.post('/signup', async (req, res) => {
    UserController.create(req, res);
})

router.patch('/address/:id', async (req, res) => {
    UserController.addAddress(req, res);
})

router.post('/login', async (req, res) => {
    UserController.login(req, res);
})

router.get('/list-users', isAdmin, UserController.getUsers)

router.patch('/set-pin/:id', async (req, res) => {
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

router.patch('/deactivate/:id', isValidPassword, isAdmin, async (req, res) =>{
    UserController.deactivateAccount(req, res);
})

router.patch('/activate/:id', isAdmin, async (req, res) =>{
    UserController.activateAccount(req, res);
})

router.patch('/profile-picture/:id', upload.single('image'), async (req, res) => {
    UserController.updateProfilePicture(req, res);
})

router.get('/profile/:id', async (req, res) => {
    UserController.userProfile(req, res);
})

router.get('/percentage/:id', async (req, res) => {
    UserController.getPorcentage(req, res);
})

router.patch('/update-user/:id', async (req, res) => {
    isAdmin, UserController.updateUserAdmin(req, res)
});

router.post('/assign-parent/:cajeroId', isAdmin, UserController.assignParentUser);
router.get('/potential-parents', UserController.getPotentialParentUsers);
router.patch('/:userId/role', isAdmin, UserController.addUserRole);

module.exports = router;

