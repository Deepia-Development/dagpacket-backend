const { MongoClient, ObjectId } = require('mongodb');
const url = process.env.MONGO_URI;
const dbName = 'dagpacket.x1pdodj.mongodb.net';  // Cambia esto al nombre de tu base de datos

// Función para obtener todos los escaneos (documentos) en la colección scan_service
exports.getAllScans = async () => {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('scan_service');
    
    const availableServices = await collection.find({}).toArray();  // Obtener todos los documentos
    client.close();
  
    return availableServices;  // Retorna los datos para que el controlador los maneje
  };
  
  // Función para actualizar el código de barras de un documento específico
  exports.updateBarcode = async (serviceId, barcode) => {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('scan_service');
  
    // Actualizar el código de barras del documento con el ID dado
    const result = await collection.updateOne(
      { _id: new ObjectId(serviceId) },  // Busca el documento por su _id
      { $set: { barcode: barcode } }  // Establece el nuevo valor del código de barras
    );
    
    client.close();
    
    if (result.matchedCount === 0) {
      throw new Error('Servicio no encontrado');
    }
  
    return { message: 'Código de barras actualizado exitosamente' };
  };