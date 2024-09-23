const LoginLockerModel = require("../models/Log/LogLockerModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function create(req) {
  try {
    const { username, password, id_locker } = req.body;
    const user = await LoginLockerModel.findOne({ username });
    if (user) {
      return { error: "El usuario ya existe" };
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = new LoginLockerModel({
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
      { $project: { username: 1, password: 1, locker_info: 1 } }, // Proyectar los campos necesarios
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
      { $project: { username: 1, password: 1, locker_info: 1 } }, // Proyectar los campos necesarios
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
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.TOKEN, {
      expiresIn: "1d",
    });

    // Devolver el token y todos los datos del usuario, incluyendo la información del locker
    return {
      token,
      user: {
        username: user.username,
        locker_info: user.locker_info, // Información del locker
      },
    };
  } catch (error) {
    console.error("Error login LockerLogin", error);
    return { error: "Error al iniciar sesión" };
  }
}

module.exports = {
  create,
  login,
  getIdByToken,
};
