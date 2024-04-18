const jwt = require("jsonwebtoken");
const { excludeRoutes } = require("./ExcludeRoutes");

const verifyToken = (req, res, next) =>{
    if(excludeRoutes.includes(req.path)){
        return next();
    }

    const token = req.header("auth-token");
    if(!token) return res.status(401).json({ error: "Access denied"});
    try {
        const isValid = jwt.verify(token, process.env.TOKEN);
        req.email = isValid;
        next();
    } catch (error) {
        res.status(401).json({ error: "Session expired" })
    }
}

module.exports = verifyToken;

