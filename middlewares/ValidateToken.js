const jwt = require("jsonwebtoken");
const { excludeRoutes } = require("./ExcludeRoutes");

const verifyToken = (req, res, next) => {
  if (excludeRoutes.includes(req.path)) {
    return next();
  }

  const token = req.header("auth-token");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.TOKEN);
    req.user = decoded; // Asignar la información decodificada del token a req.user
    next();
  } catch (error) {
    res.status(401).json({ error: "Session expired" });
  }
};

module.exports = verifyToken;