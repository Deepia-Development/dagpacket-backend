const { MongoClient, ObjectId } = require('mongodb');
const url = process.env.MONGO_URI;


exports.getAllScans = async () => {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('scan_service');
    
    const availableServices = await collection.find({}).toArray();  
    client.close();
  
    return availableServices;  
  };
  

  exports.updateBarcode = async (serviceId, barcode) => {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('scan_service');

    const result = await collection.updateOne(
      { _id: new ObjectId(serviceId) },  
      { $set: { barcode: barcode } }  
    );
    
    client.close();
    
    if (result.matchedCount === 0) {
      throw new Error('Servicio no encontrado');
    }
  
    return { message: 'Código de barras actualizado exitosamente' };
  };