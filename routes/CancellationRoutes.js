const CancellationController = require('../controllers/CancellattionRequestController');
const router = require('express').Router();
const multer = require('multer');
const upload = multer();

router.post('/createRequest',  async (req, res) => {
    CancellationController.createCancellationRequest(req, res);
})

module.exports = router;