const routes = require('express').Router();
const RecolectController = require('../controllers/RecolectController');


routes.post('/recolect', RecolectController.createRecolect);


module.exports = routes;