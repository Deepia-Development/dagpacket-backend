const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const url = process.env.MONGO_URI;  // Asegúrate de que MONGO_URI esté correctamente configurado
const dbName = 'dagpacket';  // Cambia esto al nombre de tu base de datos, NO la URL completa

// Conectar a MongoDB
async function connectToDb() {
  const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbName);  // Cambia 'dagpacket' por el nombre de tu base de datos
  return { client, db };
}

// Obtener todos los servicios disponibles en la colección scan_service
exports.getAvailableServices = async (req, res) => {
  try {
    const { client, db } = await connectToDb();  // Conectar a la base de datos
    const collection = db.collection('scan_service');

    // Obtener todos los documentos en la colección 'scan_service'
    const availableServices = await collection.find({}).toArray();
    client.close();

    res.json(availableServices);  // Devolver los datos obtenidos al frontend
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
    const { client, db } = await connectToDb();  // Conectar a la base de datos
    const collection = db.collection('scan_service');

    // Actualizar el documento con el nuevo código de barras
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },  // Buscar el documento por ID
      { $set: { barcode: barcode } }  // Actualizar el campo 'barcode'
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
