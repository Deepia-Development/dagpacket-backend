const UserModel = require('../models/UsersModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function create(req) {
  try {
    const userExists = await UserModel.findOne({ email: req.body.email });
    if (userExists) {
      return errorResponse('Este correo ya tiene una cuenta, intenta con otro');
    }

    const { name, surname, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({ name, surname, phone, email, password: hashedPassword });
    await user.save();

    return successResponse('Usuario creado exitosamente');
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    return errorResponse('Error: ' + error);
  }
}

async function login (req){
    try {
        const userExists = await UserModel.findOne({ email: req.body.email });
    
        if(!userExists) {
            return errorResponse('Usuario no encontrado, intenta de nuevo')
        }
        if(!userExists.active) {
          return errorResponse('Tu cuenta no ha sido activada aún, contacta con tu proveedor')
        }

        const validPass = await bcrypt.compareSync(
            req.body.password,
            userExists.password
        );

        if(!validPass) return { 
            success: false,
            message: "Invalid password! Try again" 
        };

        const token = jwt.sign({ user: {
            _id: userExists.id,
            name: userExists.name,
            surname: userExists.surname,
            email: userExists.email,
            role: userExists.role,
        } }, process.env.TOKEN, {
            expiresIn: process.env.EXPIRATION,
        })

        return {
            success: true,   
            access_token: token,         
            _id: userExists.id,
            name: userExists.name,
            surname: userExists.surname,
            email: userExists.email,
            role: userExists.role,            
            expiresIn: process.env.EXPIRATION
        };
    } catch (error) {
        console.log('No se pudo iniciar la sesion: ' + error);
        return errorResponse('No se pudo iniciar la sesion');
    }
}

async function addAddress(req) {
    try {
      const { id } = req.params;
      const { street, city, state, country, zip_code, external_number, internal_number, settlement, municipality } = req.body;
  
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        {
          $set: {
            'address.street': street,
            'address.city': city,
            'address.state': state,
            'address.country': country,
            'address.zip_code': zip_code,
            'address.external_number': external_number,
            'address.internal_number': internal_number,
            'address.settlement': settlement,
            'address.municipality': municipality,
          },
        },
        { new: true }
      );
  
      if (!updatedUser) {
        return errorResponse('Usuario no encontrado');
      }
  
      return successResponse('Dirección actualizada');
    } catch (error) {
      console.error('Error al agregar la dirección', error);
      return errorResponse(error.message);
    }
  }


async function listUsers(){
    try {
        const User = await UserModel.find();
        return dataResponse('Lista de usuarios', User)
    } catch (error) {
        console.log('No se pudieron obtener los datos: ' +  error);
        return errorResponse('No se pudieron obtener los datos')
    }
}


async function addPin(req) {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { pin },
      { new: true });

    if (!updatedUser) {
      return errorResponse('Usuario no encontrado');
    }

    return successResponse('PIN configurado');
  } catch (error) {
    console.error('Error al configurar el PIN:', error);
    return errorResponse('Hubo un error al configurar el PIN');
  }
}

async function changePassword(req) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password: ' + hashedPassword);
    console.log('Password: ' + password);

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse('Usuario no encontrado');
    }

    return successResponse('Contraseña actualizada', updatedUser);
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
    return errorResponse('Hubo un error al actualizar la contraseña');
  }
}

async function update(req){
  try {
    const { id } = req.params;
    const { name, surname, phone } = req.body;
    const User = await UserModel.findOneAndUpdate(
      { _id: id}, 
      { name, surname, phone },
      { new: true });

    if(User){
      return {
        data: User
      }  
    }
  } catch (error) {
    console.log('No se pudieron actualizar los datos: ' + error);
    return errorResponse('No se pudo actualizar el usuario')
  }
}

async function addRole(req){
  try {
    const { id } = req.params;
    const { role } = req.body;

    const User = await UserModel.findOneAndUpdate({ _id: id },
    { role }, {new: true });

    if(User){
      return successResponse('Rol actualizado')
    }
  } catch (error) {
    console.log('No se pudo actualizar rol: ' + error );
    return errorResponse('No se pudo actualizar el rol');
  }
}

async function deactivateAccount(req){
  try {
    const { id } = req.params;    
    const User = await UserModel.findOneAndUpdate({_id: id},{
      active: false
    },{new: true})
    
    if(User){
      return successResponse('Cuenta desactivada');
    }
  } catch (error) {
    console.log('No se pudo desactivar la cuenta: ' + error );
    return errorResponse('No se pudo desactivar la cuenta')
  }
}

async function activateAccount(req){
  try {
    const { id } = req.params;
    const User = await UserModel.findOneAndUpdate({ _id: id},
    {active: true });
    
    if(User){
      return successResponse('Cuenta activada');
    }

  } catch (error) {
    console.log('No se pudo activar la cuenta: '+ error);
    return errorResponse('No se pudo activar la cuenta')
  }
}

module.exports = {
    create,
    login,
    addAddress,
    listUsers,
    addPin,
    changePassword,
    update,
    addRole,
    deactivateAccount,
    activateAccount
}