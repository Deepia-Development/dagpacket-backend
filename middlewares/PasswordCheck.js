const bcrypt = require('bcrypt');
const UserModel = require('../models/UsersModel');;

const PasswordCheckMiddleware = async (req, res, next) => {
  try {    
    const { password } = req.body;    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere una contraseña' });
    }    
    const { id } = req.params;
    console.log(id);
    const user = await UserModel.findOne({_id: id});    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Contraseña incorrecta' });
    }
    
    next();
  } catch (error) {
    console.log('Error en el middleware PasswordCheckMiddleware:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = PasswordCheckMiddleware;
