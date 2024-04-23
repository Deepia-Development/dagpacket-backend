const isAdmin = (req, res, next) => {    
    if (req.user && req.user.user.role === 'ADMIN') {
      return next();
    } else {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }
};

module.exports = { isAdmin };
