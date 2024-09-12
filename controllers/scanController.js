const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const url = process.env.MONGO_URI;  // Asegúrate de que MONGO_URI esté correctamente configurado
const dbName = 'dagpacket.x1pdodj.mongodb.net';  // Cambia esto al nombre de tu base de datos

// Obtener todos los servicios disponibles en la colección scan_service
exports.getAvailableServices = async (req, res) => {
  try {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('scan_service');
    
    const availableServices = await collection.find({}).toArray();  // Obtiene todos los documentos en la colección
    client.close();

    res.json(availableServices);  // Envía los datos obtenidos al frontend
  } catch (error) {
    console.error('Error al obtener los servicios disponibles:', error);
    res.status(500).json({
      error: 'Error al obtener los servicios disponibles',
      message: error.message
    });
  }
};

// Actualizar el código de barras en la colección scan_service
exports.updateBarcode = async (req, res) => {
  const { id } = req.params;  // ID del documento en MongoDB
  const { barcode } = req.body;  // El nuevo código de barras enviado desde el frontend

  if (!barcode) {
    return res.status(400).json({ error: 'El código de barras es obligatorio' });
  }

  try {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('scan_service');

    // Actualiza el documento con el nuevo código de barras
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },  // Busca el documento por ID
      { $set: { barcode: barcode } }  // Actualiza el campo 'barcode'
    );

    client.close();

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ message: 'Código de barras actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el código de barras:', error);
    res.status(500).json({
      error: 'Error al actualizar el código de barras',
      message: error.message
    });
  }
};
