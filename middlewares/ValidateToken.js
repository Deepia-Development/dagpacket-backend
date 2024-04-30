const jwt = require("jsonwebtoken");
const { excludeRoutes } = require("./ExcludeRoutes");

const verifyToken = (req, res, next) => {
  if (excludeRoutes.includes(req.path)) {
    return next();
  }

  // Obtener el token del header Authorization
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied" });
  }

  // Extraer el token de la cabecera
  const token = authHeader.split(" ")[1];
  
  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.TOKEN);
    req.user = decoded; // Asignar la información decodificada del token a req.user
    next();
  } catch (error) {
    res.status(401).json({ error: "Session expired" });
  }
};

module.exports = verifyToken;
