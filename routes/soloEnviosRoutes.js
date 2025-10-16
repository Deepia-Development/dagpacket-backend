const router = require('express').Router();
const soloEnviosController = require('../controllers/soloEnviosController');

router.get('/products', soloEnviosController.getProducts);


module.exports = router;