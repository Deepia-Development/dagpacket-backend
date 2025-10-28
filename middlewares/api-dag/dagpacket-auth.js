const axios = require("axios");
const config = require("../../config/config");

let dagpacketToken = null;
let tokenExpiration = null;

async function refreshDagpacketToken() {
  try {
    const response = await axios.post(`${config.apiDagpacket.apiUrl}/users/login`, {
      username: config.apiDagpacket.username,
      password: config.apiDagpacket.password,
    });

    console.log("Dagpacket authentication response:", response.data);

    const data = response.data.data; // aquí viene el token real

    dagpacketToken = data.token;
    console.log("Nuevo token Dagpacket obtenido:", dagpacketToken);

    let expiresIn = data.expiresIn || "10s"; // string: "10h", "5m"...

    // convertir a milisegundos
    const unit = expiresIn.slice(-1); // h | m | s
    const value = parseInt(expiresIn.slice(0, -1), 10);

    let milliseconds = 0;
    if (unit === "h") milliseconds = value * 60 * 60 * 1000;
    if (unit === "m") milliseconds = value * 60 * 1000;
    if (unit === "s") milliseconds = value * 1000;

    tokenExpiration = Date.now() + milliseconds;
    
  } catch (error) {
    console.error("Error al autenticar Dagpacket:", error.response?.data || error.message);
    dagpacketToken = null;
  }
}

async function dagpacketAuth(req, res, next) {
  try {
    const tokenExpired =
      !dagpacketToken || !tokenExpiration || Date.now() >= tokenExpiration;

    if (tokenExpired) {
      console.log("Token Dagpacket expirado. Renovando...");
      await refreshDagpacketToken();
    }

    req.dagpacketToken = dagpacketToken;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Error autenticando Dagpacket" });
  }
}

module.exports = { dagpacketAuth };
