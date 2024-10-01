const LoginLockerModel = require("../models/LoginLockerModel");
const UserModel = require('../models/UsersModel');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function create(req) {
  try {
    const { user_id, username, password, id_locker } = req.body;
    const user = await LoginLockerModel.findOne({ username });
    if (user) {
      return { error: "El usuario ya existe" };
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = new LoginLockerModel({
      user_id,
      username,
      password: hash,
      id_locker,
    });
    await newUser.save();
    return newUser;
  } catch (error) {
    return { error: error.message };
  }
}

// Función para generar una nueva contraseña
async function generateNewPassword(req, res) {
  try {
    const { username, password } = req.body;

    // Verificar si se proporcionaron el nombre de usuario y la nueva contraseña
    if (!username || !password) {
      return errorResponse("Nombre de usuario o contraseña no proporcionados");
    }

    console.log("Generando nueva contraseña para,", username);
    console.log("Nueva contraseña es:", password);

    // Generar un nuevo hash para la nueva contraseña
    const hash = await bcrypt.hash(password, 10);

    // Actualizar la contraseña del usuario directamente
    const updatedUser = await LoginLockerModel.findOneAndUpdate(
      { username },
      { password: hash },
      { new: true } // Esto devuelve el documento actualizado
    );


    // Si no se encuentra el usuario
    if (!updatedUser) {
      return errorResponse("Usuario no encontrado");
    }

    // Retornar respuesta exitosa
    return successResponse("Contraseña actualizada correctamente");
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    return errorResponse("Error al actualizar la contraseña");
  }
}


const getIdByToken = async (req) => {
  try {
    const token = req.body.token;
    const decoded = jwt.verify(token, process.env.TOKEN);

    // Asegúrate de que decoded tenga el campo que necesitas
    const username = decoded.username;

    const user = await LoginLockerModel.aggregate([
      { $match: { username: username } }, // Filtrar por nombre de usuario
      {
        $lookup: {
          from: "lockers", // Nombre de la colección de lockers
          localField: "id_locker", // Campo en LockerLogin
          foreignField: "_id", // Campo en Lockers
          as: "locker_info", // Alias para el resultado del lookup
        },
      },
      { $unwind: "$locker_info" }, // Desglosa el array de locker_info
      { $project: { user_id: 1, username: 1, password: 1, locker_info: 1 } }, // Proyectar los campos necesarios
    ]);

    if (!user || user.length === 0) {
      // Verificar si el usuario existe
      return { error: "Usuario no encontrado" };
    }

    // console.log(user);
    return user[0]; // Retorna el primer elemento encontrado
  } catch (error) {
    return { error: error.message };
  }
};

async function login(req) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return { error: "Usuario o contraseña no proporcionados" };
    }

    // Ejecutar la query aggregate para obtener la información del usuario y del locker
    const userWithLockerInfo = await LoginLockerModel.aggregate([
      { $match: { username } }, // Filtrar por nombre de usuario
      {
        $lookup: {
          from: "lockers", // Nombre de la colección de lockers
          localField: "id_locker", // Campo en LockerLogin
          foreignField: "_id", // Campo en Lockers
          as: "locker_info", // Alias para el resultado del lookup
        },
      },
      { $unwind: "$locker_info" }, // Desglosa el array de locker_info
      { $project: { user_id: 1, username: 1, password: 1, locker_info: 1 } }, // Proyectar los campos necesarios
    ]);

    // Verificar si el usuario existe
    if (!userWithLockerInfo || userWithLockerInfo.length === 0) {
      return { error: "Usuario no encontrado" };
    }

    const user = userWithLockerInfo[0]; // Como usamos $unwind, solo habrá un usuario

    // Comparar la contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { error: "Contraseña incorrecta" };
    }

    // Generar el token incluyendo el username
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.TOKEN,
      {
        expiresIn: "1d",
      }
    );

    // Devolver el token y todos los datos del usuario, incluyendo la información del locker
    return {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        locker_info: user.locker_info, // Información del locker
      },
    };
  } catch (error) {
    console.error("Error login LockerLogin", error);
    return { error: "Error al iniciar sesión" };
  }
}

async function getUserLockerById(req) {
  try {
    const { id } = req.params; // Cambiado para extraer 'id' de req.params
    const lockerUser = await LoginLockerModel.findOne({ id_locker: id }); // Suponiendo que el campo es '_id' en MongoDB
    if(!lockerUser) {
      return errorResponse("Locker Usuario no encontrado");
    }

    const user = await UserModel.findOne({ _id: lockerUser.user_id });

    if (!user) {
      return errorResponse("Usuario no encontrado");
    }


    return {
      locker: lockerUser,
      user: user,
    };
  } catch (error) {
    return errorResponse("Error al obtener el usuario");
  }
}


async function editUserInfo(req) {
  try {
    const { id } = req.params;
    const { username, user_id ,password } = req.body;

    // Verifica si el usuario existe
    const user = await LoginLockerModel.findById(id);
    if (!user) {
      return { error: "Usuario no encontrado" };
    }

    // Hash de la nueva contraseña
    const hash = await bcrypt.hash(password, 10);

    // Actualiza el usuario usando el método update
    const updatedUser = await LoginLockerModel.updateOne(
      { _id: id },
      {
        $set: {
          username: username,
          user_id: user_id,
          password: hash,
        },
      }
    );

    if (updatedUser.modifiedCount === 0) {
      return { error: "No se pudo actualizar el usuario" };
    }
    return successResponse("Usuario actualizado correctamente");
  } catch (error) {
    return errorResponse("Error al actualizar el usuario");
  }
}

module.exports = {
  generateNewPassword,
  create,
  login,
  getIdByToken,
  getUserLockerById,
  editUserInfo,
};
