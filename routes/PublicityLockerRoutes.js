const PublicityLockerController = require('../controllers/PublicityLockerController');
const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');


// Configuración de multer para almacenar archivos en el disco
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/contracts');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve('uploads/contracts');
    
    // Crea el directorio si no existe
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.post('/create', upload.single('contract'), async (req, res) => {
  PublicityLockerController.create(req, res);
});

router.get('/locker/:lockerId', (req, res) => {
  PublicityLockerController.getByLocker(req, res);
});

router.post('/', (req, res) => {
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