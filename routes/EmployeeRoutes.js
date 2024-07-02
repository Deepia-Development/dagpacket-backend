const EmployeeController = require('../controllers/EmployeeController');
const router = require('express').Router();

router.post('/create', async (req, res) =>{
    EmployeeController.create(req, res);
})


module.exports = router;