require('dotenv').config();
const mongoose = require('mongoose');
const UserService = require('../services/UserService');

// Configuración de la base de datos
const dbConfig = process.env.MONGO_URI;

if (!dbConfig) {
    console.error("No se encontró MONGO_URI en .env");
    process.exit(1);
}

mongoose.connect(dbConfig, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Conectado a la base de datos');
        runUpdate();
    })
    .catch(err => {
        console.error('Error de conexión:', err);
        process.exit(1);
    });

async function runUpdate() {
    try {
        const result = await UserService.batchUpdateCommissions();
        console.log("Resultado:", result);
        process.exit(0);
    } catch (error) {
        console.error("Error ejecutando update:", error);
        process.exit(1);
    }
}
