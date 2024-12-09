// routes/labelRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'labels', req.params.filename);
  
  // Verifica si el archivo existe
  if (fs.existsSync(filePath)) {
    // Si el archivo existe, lo envía
    res.sendFile(filePath);
  } else {
    // Si no existe, crea el archivo con contenido predeterminado
    const directoryPath = path.dirname(filePath);
    
    // Verifica si el directorio existe, si no, lo crea
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    
    // Crea un archivo nuevo con contenido por defecto
    fs.writeFileSync(filePath, 'Contenido predeterminado para la etiqueta.');
    
    // Luego envía el archivo recién creado
    res.sendFile(filePath);
  }
});

module.exports = router;
