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
const UserPackingRoutes = require('./routes/UserPackingRoutes.js');
const EmployeeRoutes = require('./routes/EmployeeRoutes.js');
const CancellationRoutes = require('./routes/CancellationRoutes.js');
const CashRegisterRoutes = require('./routes/CashRegisterRouter');
const AddressRoutes = require('./routes/AddressRoutes.js');
const RechargeRequestRoutes = require('./routes/RechargueRequestRoutes.js');
const RefillRoutes = require('./routes/RefillRoutes.js')

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

// Configuración de middleware
app.use(verifyToken);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('combined')); 

app.use('/api/v1/users', UserRoutes);
app.use('/api/v1/roles', RoleRoutes);
app.use('/api/v1/shipments', ShipmentRoutes);
app.use('/api/v1/tracking', TrackingRoutes);
app.use('/api/v1/packing', PackingRoutes);
app.use('/api/v1/stock', UserPackingRoutes);
app.use('/api/v1/employees', EmployeeRoutes);
app.use('/api/v1/cancellations', CancellationRoutes);
app.use('/api/v1/cash-register', CashRegisterRoutes);
app.use('/api/v1/addresses', AddressRoutes);
app.use('/api/v1/rechargues', RechargeRequestRoutes)
app.use('/api/v1/refill-requests/', RefillRoutes)

// Iniciar el servidor
db.run().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(err => {
  console.error('Error connecting to database:', err.message);
});