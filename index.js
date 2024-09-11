const express = require("express");
const db = require("./db-config.js");
const cors = require('cors');
const morgan = require('morgan');
const verifyToken = require('./middlewares/ValidateToken.js');
const bodyParser = require("body-parser");
const path = require('path');


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
const shippingRoutes = require('./routes/shippingRoutes.js')
const labelRoutes = require('./routes/labelRoutes');
const emidaRoutes = require('./routes/emidaRoutes');
const servicesRoutes = require('./routes/ServicesRoutes.js')
const customerRoutes = require('./routes/CustomerRoutes.js')
const contractRoutes = require('./routes/ContractRoutes.js');
const mqttRoutes = require('./routes/mqttRoutes.js')
const walletRoutes = require('./routes/walletRoutes.js')
const pluginRoutes = require('./routes/pluginRoutes.js')

const app = express();
const port = process.env.PORT || 3000;
app.use(cors("dev"));
const baseApi = "/api/v1/";

// Configuración de middleware
 
app.use('/labels', express.static(path.join(__dirname, 'public', 'labels')));
app.use('/labels', labelRoutes);

app.use(verifyToken);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('dev'));

``
app.use(`${baseApi}users`, UserRoutes);
app.use(`${baseApi}roles`, RoleRoutes);
app.use(`${baseApi}shipments`, ShipmentRoutes);
app.use(`${baseApi}tracking`, TrackingRoutes);
app.use(`${baseApi}packing`, PackingRoutes);
app.use(`${baseApi}stock`, UserPackingRoutes);
app.use(`${baseApi}employees`, EmployeeRoutes);
app.use(`${baseApi}cancellations`, CancellationRoutes);
app.use(`${baseApi}cash-register`, CashRegisterRoutes);
app.use(`${baseApi}addresses`, AddressRoutes);
app.use(`${baseApi}rechargues`, RechargeRequestRoutes)
app.use(`${baseApi}refill-requests`, RefillRoutes)
app.use(`${baseApi}shipping`, shippingRoutes);
app.use(`${baseApi}emida`, emidaRoutes);
app.use(`${baseApi}services`, servicesRoutes);
app.use(`${baseApi}customer`, customerRoutes);
app.use(`${baseApi}contract`, contractRoutes);
app.use(`${baseApi}mqtt`, mqttRoutes);
app.use(`${baseApi}wallets`, walletRoutes)
app.use(`${baseApi}dhl`, pluginRoutes);

// Iniciar el servidor
db.run().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(err => {
  console.error('Error connecting to database:', err.message);
});