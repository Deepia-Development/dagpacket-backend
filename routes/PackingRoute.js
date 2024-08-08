const PackingController = require('../controllers/PackingController');
const multer = require('multer');
const router = require('express').Router();

const upload = multer();

router.post('/create', upload.single('image'), async (req, res) => {
    PackingController.create(req, res);
})

router.get('/list', async (req, res) => {
    PackingController.getPacking(req, res);
})

router.patch('/:id', PackingController.updatePacking);

router.delete('/:id', PackingController.deletePacking);

module.exports = router;
