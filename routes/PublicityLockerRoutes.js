const PublicityLockerController = require('../controllers/PublicityLockerController');
const router = require('express').Router();
const multer = require('multer');

// Configuración de multer para almacenar archivos en el disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/contracts');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/create', upload.single('contract'), async (req, res) => {
  PublicityLockerController.create(req, res);
});

router.get('/locker/:lockerId', (req, res) => {
  PublicityLockerController.getByLocker(req, res);
});

router.get('/:id', (req, res) => {
  PublicityLockerController.getById(req, res);
});

router.put('/locker/:lockerId/advertisement/:advertisementId', 
  upload.single('contract'),
  (req, res) => {
    PublicityLockerController.update(req, res);
});

router.delete('/locker/:lockerId/advertisement/:advertisementId', (req, res) => {
  PublicityLockerController.delete(req, res);
});

module.exports = router;