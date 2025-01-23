const routes = require('express').Router();
const RecolectController = require('../controllers/RecolectController');


routes.post('/recolect', RecolectController.createRecolect);
routes.get('/all', RecolectController.getAllRecolects);
routes.get('/user/:userId', RecolectController.getRecolectsByUser);


module.exports = routes;