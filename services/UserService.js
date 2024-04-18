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

        const validPass = await bcrypt.compareSync(
            req.body.password,
            userExists.password
        );

        if(!validPass) return { 
            success: false,
            message: "Invalid password! Try again" 
        };

        const token = jwt.sign({ email: userExists }, process.env.TOKEN, {
            expiresIn: process.env.EXPIRATION,
        })

        return {
            success: true,            
            _id: userExists.id,
            name: userExists.name,
            surname: userExists.surname,
            email: userExists.email,
            role: userExists.role,
            token,
            expiresIn: process.env.EXPIRATION
        };
    } catch (error) {
        return { 
            message: "Internal server error!", 
            error: error.message
        }
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
        return dataResponse('Lista de usuario', User)
    } catch (error) {
        return errorResponse('No se pudieron obtener los datos' + error )
    }
}

module.exports = {
    create,
    login,
    addAddress,
    listUsers
}