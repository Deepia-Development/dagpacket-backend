const express = require("express");
const db = require("./db-config.js");
const cors = require('cors');
const morgan = require('morgan');
const verifyToken = require('./middlewares/ValidateToken.js');
const bodyParser = require("body-parser");



// Rutas
const UserRoutes = require('./routes/UserRoutes.js');
const RoleRoutes = require('./routes/RoleRoutes.js');
const ShipmentRoutes = require('./routes/ShipmentsRoutes.js');
const TrackingRoutes = require('./routes/TrackingRoutes.js');
const PackingRoutes = require('./routes/PackingRoute.js');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

// Configuración de middleware
app.use(verifyToken);
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('combined')); // Puedes ajustar el formato de registro según tus necesidades


app.use('/api/v1/users', UserRoutes);
app.use('/api/v1/roles', RoleRoutes);
app.use('/api/v1/shipments', ShipmentRoutes);
app.use('/api/v1/tracking', TrackingRoutes);
app.use('/api/v1/packing', PackingRoutes)

// Middleware de verificación de token


// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Iniciar el servidor
db.run().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(err => {
  console.error('Error connecting to database:', err.message);
});