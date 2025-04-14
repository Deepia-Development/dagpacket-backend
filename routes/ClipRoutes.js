const express = require('express');
const router = express.Router();

const clipController = require('../controllers/ClipController');



router.get("/all", clipController.getClip);
router.post("/refound/:id", clipController.refoundClip);



module.exports = router;