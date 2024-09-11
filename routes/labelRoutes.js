// routes/labelRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'labels', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Etiqueta no encontrada');
  }
});

module.exports = router;

// En tu app.js o server.js
