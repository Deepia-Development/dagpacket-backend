const ServicesController = require('../controllers/ServicesController');
const { isAdmin } = require('../middlewares/AdminAuth');
const router = require('express').Router();

router.post('/create', isAdmin, async (req, res) =>{
    ServicesController.create(req, res);
})

router.get('/services-history', isAdmin, async (req, res) =>{
    ServicesController.getAllServices(req, res);
})

router.get('/services-history/:id', async (req, res) => {
    ServicesController.getUserService(req, res);
})


module.exports = router;