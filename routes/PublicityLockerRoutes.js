const PublicityLockerController = require('../controllers/PublicityLockerController');
const router = require('express').Router();

router.post('/create',async (req,res)=>{
    PublicityLockerController.create(req,res);
})

module.exports = router;




