const PackingController = require('../controllers/PackingController');
const multer = require('multer');
const router = require('express').Router();

const upload = multer();

router.post('/create', upload.single('image'), async (req, res) => {
    PackingController.create(req, res);
})

router.get('/list', async (req, res) => {
    PackingController.listPacking(req, res);
})

module.exports = router;
