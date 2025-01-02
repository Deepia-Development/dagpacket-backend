const UserModel = require("../models/UsersModel");
const RoleModel = require("../models/RolesModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const WalletModel = require("../models/WalletsModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const TrackingModel = require("../models/TrackingModel");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Utiliza TLS
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
});

async function passwordResetService() {
  return {
    requestPasswordReset: async (email) => {
      try {
        const user = await UserModel.findOne({ email });
        if (!user) {
          return errorResponse(
            "No existe un usuario con ese correo electrónico."
          );
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;

        await user.save();

        // Enviar email
        const resetUrl = `https://www.dagpacket.cloud/reset-password/${token}`;
        const mailOptions = {
          to: user.email,
          from: process.env.SMTP_USERNAME,
          subject: "Reseteo de Contraseña",
          html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Restablecer Contraseña</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333333;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
                }
                .header {
                  background-color: #D6542B;
                  color: #ffffff;
                  text-align: center;
                  padding: 30px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 24px;
                }
                .content {
                  padding: 30px;
                  text-align: center;
                }
                .content h2 {
                  margin-top: 0;
                  color: #D6542B;
                }
                .button {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #D6542B;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: bold;
                  margin-top: 20px;
                }
                .button:hover {
                  background-color: #C14623;
                }
                .footer {
                  background-color: #f8f8f8;
                  text-align: center;
                  padding: 15px;
                  font-size: 0.8em;
                  color: #666666;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>DAGPACKET</h1>
                </div>
                <div class="content">
                  <h2>Restablecimiento de Contraseña</h2>
                  <p>Estimado/a ${user.name},</p>
                  <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en DAGPACKET. Si tú realizaste esta solicitud, por favor haz clic en el botón de abajo para proceder con el restablecimiento de tu contraseña:</p>
                  <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                  <p>Si no solicitaste este cambio, puedes ignorar este correo electrónico. Tu contraseña actual seguirá siendo válida.</p>
                  <p>Si tienes alguna pregunta o necesitas asistencia adicional, no dudes en contactarnos.</p>
                  <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 DAGPACKET. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
        return successResponse(
          "Se ha enviado un email con las instrucciones para resetear tu contraseña."
        );
      } catch (error) {
        console.error("Error en requestPasswordReset:", error);
        console.error("Error al enviar el correo electrónico:", error);
        return errorResponse("Ocurrió un error al procesar tu solicitud.");
      }
    },

    resetPassword: async (token, newPassword) => {
      try {
        const user = await UserModel.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
          return errorResponse(
            "El token para resetear la contraseña es inválido o ha expirado."
          );
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return successResponse("Tu contraseña ha sido actualizada.");
      } catch (error) {
        console.error("Error en resetPassword:", error);
        return errorResponse("Ocurrió un error al resetear la contraseña.");
      }
    },
  };
}

async function updateProfilePicture(req) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return errorResponse("No se ha proporcionado una imagen");
    }
    const image = req.file.buffer;
    const user = await UserModel.findOneAndUpdate(
      { _id: id },
      {
        image,
      },
      { new: true }
    );
    await user.save();
    if (user) {
      return successResponse("Foto actualizada");
    }
  } catch (error) {
    console.log("Error al subir la imagen: " + error);
    return errorResponse("Error el actualizar la imagen de perfil");
  }
}

async function getPorcentage(req) {
  try {
    const { id } = req.params;
    const user = await UserModel.findOne({ _id: id });

    if (!user) {
      return errorResponse("Usuario no encontrado");
    }

    const porcentaje = user.dagpacketPercentaje;

    return dataResponse("Porcentaje: ", porcentaje);
  } catch (error) {
    return errorResponse("Error: " + error);
  }
}

async function create(req) {
  try {
    const userExists = await UserModel.findOne({ email: req.body.email });
    if (userExists) {
      return errorResponse("Este correo ya tiene una cuenta, intenta con otro");
    }

    const { name, surname, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      name,
      surname,
      phone,
      email,
      password: hashedPassword,
    });

    await user.save();

    return successResponse("Usuario creado exitosamente");
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    return errorResponse("Error: " + error.message);
  }
}

async function login(req) {
  try {
    const userExists = await UserModel.findOne({ email: req.body.email });

    if (!userExists) {
      return errorResponse("Usuario no encontrado, intenta de nuevo");
    }
    if (!userExists.active) {
      return errorResponse(
        "Tu cuenta no ha sido activada aún, contacta con tu proveedor"
      );
    }

    const validPass = await bcrypt.compareSync(
      req.body.password,
      userExists.password
    );

    if (!validPass)
      return {
        success: false,
        message: "Contraseña incorrecta! Intenta de nuevo",
      };

    const token = jwt.sign(
      {
        user: {
          _id: userExists.id,
          name: userExists.name,
          surname: userExists.surname,
          email: userExists.email,
          role: userExists.role,
        },
      },
      process.env.TOKEN,
      {
        expiresIn: process.env.EXPIRATION,
      }
    );

    return {
      success: true,
      access_token: token,
      _id: userExists.id,
      name: userExists.name,
      surname: userExists.surname,
      email: userExists.email,
      role: userExists.role,
      expiresIn: process.env.EXPIRATION,
    };
  } catch (error) {
    console.log("No se pudo iniciar la sesion: " + error);
    return errorResponse("No se pudo iniciar la sesion");
  }
}

async function login_delivery(req) {
  try {
    const userExists = await UserModel.findOne({ email: req.body.email });
    if (!userExists) {
      return errorResponse("Usuario no encontrado, intenta de nuevo");
    }
  } catch (error) {
    console.log("Error al iniciar sesion: " + error);
    return errorResponse("No se pudo iniciar la sesion");
  }
}

async function getDeliveryUser(req) {
  try {
    const userExists = await UserModel.findOne({ role: "REPARTIDOR" });

    if (!userExists) {
      return errorResponse("No hay repartidores disponibles");
    }

    return dataResponse("Repartidor encontrado", userExists);
  } catch (error) {
    console.log("Error al obtener repartidor: " + error);
    return errorResponse("No se pudo obtener repartidor");
  }
}

async function asignShipmentToUser(req, res) {
  try {
    const { shipmentId, userId, type } = req.body;
    const shipment = await TrackingModel.findOne({ shipment_id: shipmentId });
    shipment.delivery = userId;
    await shipment.save();

    return successResponse("Envio asignado exitosamente");
  } catch (error) {
    return errorResponse("Error al asignar envio");
  }
}

async function updateStatuDelivery(req, res) {
  try {
    const { shipmentId, area } = req.body;
    const shipment = await TrackingModel.findOne({ shipment_id: shipmentId });

    switch (shipment.description) {
      case "El envío ha sido creado exitosamente.":
      
        shipment.area = area;
        shipment.description = "El envío ha sido asignado a un repartidor.";
        break;
      case "El envío ha sido asignado a un repartidor.":
        shipment.description = "El envío ha sido entregado.";
        shipment.title = title;
        shipment.area = area;
        break;
      default:
        shipment.description = "El envío ha sido creado exitosamente.";
        break;
    }
  } catch (error) {
    return errorResponse("Error al actualizar el estado del envio");
  }
}

async function addAddress(req) {
  try {
    const { id } = req.params;
    const {
      street,
      city,
      state,
      country,
      zip_code,
      external_number,
      internal_number,
      settlement,
      municipality,
    } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          "address.street": street,
          "address.city": city,
          "address.state": state,
          "address.country": country,
          "address.zip_code": zip_code,
          "address.external_number": external_number,
          "address.internal_number": internal_number,
          "address.settlement": settlement,
          "address.municipality": municipality,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse("Usuario no encontrado");
    }

    return successResponse("Dirección actualizada");
  } catch (error) {
    console.error("Error al agregar la dirección", error);
    return errorResponse(error.message);
  }
}

//   async function listUsers(req) {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const search = req.query.search || '';

//         const skip = (page - 1) * limit;

//         let query = {};
//         if (search) {
//             query = {
//                 $or: [
//                     { name: { $regex: search, $options: 'i' } },
//                     { surname: { $regex: search, $options: 'i' } },
//                     { email: { $regex: search, $options: 'i' } },
//                     { phone: { $regex: search, $options: 'i' } }

//                 ]
//             };
//         }

//         const totalUsers = await UserModel.countDocuments(query);
//         const totalPages = Math.ceil(totalUsers / limit);

//         const users = await UserModel.find(query)
//             .select('-password') // Excluir el campo de contraseña
//             .populate({
//                 path: 'wallet',
//                 model: 'Wallets',
//                 select: '-_id sendBalance rechargeBalance servicesBalance'
//             })
//             .skip(skip)
//             .limit(limit)
//             .lean();

//         const formattedUsers = users.map(user => ({
//             ...user,
//             image: user.image ? user.image.toString('base64') : null,
//             wallet: user.wallet ? {
//                 sendBalance: user.wallet.sendBalance ? user.wallet.sendBalance.toString() : "0",
//                 rechargeBalance: user.wallet.rechargeBalance ? user.wallet.rechargeBalance.toString() : "0",
//                 servicesBalance: user.wallet.servicesBalance ? user.wallet.servicesBalance.toString() : "0"
//             } : null
//         }));

//         return dataResponse('Lista de usuarios', {
//             users: formattedUsers,
//             currentPage: page,
//             totalPages: totalPages,
//             totalUsers: totalUsers
//         });
//     } catch (error) {
//         console.log('Error al obtener los usuarios: ' + error);
//         return errorResponse('No se pudieron obtener los datos');
//     }
// }

async function listUsers(req) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { surname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const totalUsers = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await UserModel.find(query)
      .select("-password")
      .populate({
        path: "wallet",
        model: "Wallets",
        select: "-_id sendBalance rechargeBalance servicesBalance",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sort from newest to oldest
      .lean();

    const formattedUsers = users.map((user) => ({
      ...user,
      image: user.image ? user.image.toString("base64") : null,
      wallet: user.wallet
        ? {
            sendBalance: user.wallet.sendBalance
              ? user.wallet.sendBalance.toString()
              : "0",
            rechargeBalance: user.wallet.rechargeBalance
              ? user.wallet.rechargeBalance.toString()
              : "0",
            servicesBalance: user.wallet.servicesBalance
              ? user.wallet.servicesBalance.toString()
              : "0",
          }
        : null,
    }));

    return dataResponse("Lista de usuarios", {
      users: formattedUsers,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
    });
  } catch (error) {
    console.log("Error al obtener los usuarios: " + error);
    return errorResponse("No se pudieron obtener los datos");
  }
}

async function addPin(req) {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { pin },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse("Usuario no encontrado");
    }

    return successResponse("PIN configurado");
  } catch (error) {
    console.error("Error al configurar el PIN:", error);
    return errorResponse("Hubo un error al configurar el PIN");
  }
}

async function changePassword(req) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password: " + hashedPassword);
    console.log("Password: " + password);

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse("Usuario no encontrado");
    }

    return successResponse("Contraseña actualizada", updatedUser);
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    return errorResponse("Hubo un error al actualizar la contraseña");
  }
}

async function update(req) {
  try {
    const { id } = req.params;
    const { name, surname, phone } = req.body;
    const User = await UserModel.findOneAndUpdate(
      { _id: id },
      { name, surname, phone },
      { new: true }
    );

    if (User) {
      return successResponse("Datos actualizados!");
    }
  } catch (error) {
    console.log("No se pudieron actualizar los datos: " + error);
    return errorResponse("No se pudo actualizar el usuario");
  }
}

async function addRole(req) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const User = await UserModel.findOneAndUpdate(
      { _id: id },
      { role },
      { new: true }
    );

    if (User) {
      return successResponse("Rol actualizado");
    }
  } catch (error) {
    console.log("No se pudo actualizar rol: " + error);
    return errorResponse("No se pudo actualizar el rol");
  }
}

async function deactivateAccount(req) {
  try {
    const { id } = req.params;
    const User = await UserModel.findOneAndUpdate(
      { _id: id },
      {
        active: false,
      },
      { new: true }
    );

    if (User) {
      return successResponse("Cuenta desactivada");
    }
  } catch (error) {
    console.log("No se pudo desactivar la cuenta: " + error);
    return errorResponse("No se pudo desactivar la cuenta");
  }
}

async function adminUpdateUser(req) {
  try {
    const { id } = req.params;
    const { name, surname, email, phone, role, active } = req.body;
    const user = await UserModel.findOneAndUpdate(
      { _id: id },
      { name, surname, email, phone, role, active },
      { new: true }
    );

    if (user) {
      return successResponse("Usuario actualizado");
    } else {
      return errorResponse("Error al actualizar el usuario");
    }
  } catch (error) {
    return errorResponse("Error interno del servidor: " + error.message);
  }
}

async function activateAccount(req) {
  try {
    const { id } = req.params;
    const User = await UserModel.findOneAndUpdate(
      { _id: id },
      { active: true }
    );

    if (User) {
      return successResponse("Cuenta activada");
    }
  } catch (error) {
    console.log("No se pudo activar la cuenta: " + error);
    return errorResponse("No se pudo activar la cuenta");
  }
}

async function userProfile(req, res) {
  try {
    const { id } = req.params;
    const user = await UserModel.findOne({ _id: id });

    if (user) {
      const imageBase64 = user.image ? user.image.toString("base64") : null;
      const imageUrl = imageBase64
        ? `data:image/jpeg;base64,${imageBase64}`
        : null;

      // Buscar el wallet del usuario
      const wallet = await WalletModel.findOne({ user: id });

      const parentUser = user.parentUser
        ? await UserModel.findById(user.parentUser)
        : null;

      let parentUserWallet = null;
      if (parentUser) {
        parentUserWallet = await WalletModel.findById(parentUser.wallet);
      }

      const userWithProfilePicture = {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        address: user.address,
        email: user.email,
        pin: user.pin,
        role: user.role,
        image: imageUrl,
        parentUser: parentUser
          ? {
              _id: parentUser._id,
              name: parentUser.name,
              surname: parentUser.surname,
              email: parentUser.email,
              wallet: parentUserWallet
                ? {
                    sendBalance: parentUserWallet.sendBalance,
                    rechargeBalance: parentUserWallet.rechargeBalance,
                    servicesBalance: parentUserWallet.servicesBalance,
                  }
                : null,
            }
          : null,
        wallet: wallet
          ? {
              sendBalance: wallet.sendBalance,
              rechargeBalance: wallet.rechargeBalance,
              servicesBalance: wallet.servicesBalance,
            }
          : null,
      };

      return dataResponse("Datos del usuario", userWithProfilePicture, res);
    } else {
      return errorResponse("Usuario no encontrado", res);
    }
  } catch (error) {
    console.log("Error al obtener los datos del perfil: " + error);
    return errorResponse(
      "Ocurrió un error al obtener los datos de tu perfil",
      res
    );
  }
}

async function assignParentUser(req) {
  try {
    const { cajeroId } = req.params;
    const { parentUserId } = req.body;

    console.log(
      "Asignando usuario padre:",
      parentUserId,
      "al cajero:",
      cajeroId
    );

    // Verificar si el cajero existe
    const cajero = await UserModel.findById(cajeroId);
    if (!cajero) {
      return errorResponse("Cajero no encontrado");
    }

    // Verificar si el cajero tiene el rol correcto
    if (cajero.role !== "CAJERO" && cajero.role !== "CLIENTE_CORPORATIVO") {
      return errorResponse(
        "Solo se puede asignar un usuario padre a un cajero o cliente corporativo"
      );
    }

    // Verificar si el usuario padre existe
    const parentUser = await UserModel.findById(parentUserId);
    if (!parentUser) {
      return errorResponse("Usuario padre no encontrado");
    }

    console.log("Usuario padre encontrado:", parentUser);

    // Verificar que el usuario padre no sea un cajero
    if (parentUser.role === "CAJERO") {
      return errorResponse(
        "Un cajero no puede ser asignado como usuario padre"
      );
    }

    // Asignar el usuario padre al cajero
    cajero.parentUser = parentUserId;
    await cajero.save();

    return successResponse("Usuario padre asignado exitosamente");
  } catch (error) {
    console.error("Error al asignar el usuario padre:", error);
    return errorResponse("Ocurrió un error al asignar el usuario padre");
  }
}

async function getPotentialParentUsers() {
  try {
    const potentialParents = await UserModel.find({ role: { $ne: "CAJERO" } })
      .select("_id name surname email role")
      .sort({ name: 1 });

    return dataResponse("Usuarios", potentialParents);
  } catch (error) {
    console.error("Error al obtener usuarios potenciales:", error);
    return { success: false, message: "Error al obtener usuarios potenciales" };
  }
}

async function addUserRole(userId, role) {
  try {
    // Fetch valid roles from the database
    const validRoles = await RoleModel.find({}, "role_name"); // Assuming the role model has a 'name' field

    console.log("Valid roles:", validRoles);
    // Extract role names into an array
    const validRoleNames = validRoles.map((roleDoc) => roleDoc.role_name);

    // Check if the provided role is valid
    if (!validRoleNames.includes(role)) {
      return { success: false, message: "Rol no válido" };
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { role: role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return { success: false, message: "Usuario no encontrado" };
    }

    return {
      success: true,
      data: updatedUser,
      message: "Rol asignado exitosamente",
    };
  } catch (error) {
    console.error("Error al asignar rol al usuario:", error);
    return { success: false, message: "Error al asignar rol al usuario" };
  }
}

async function updateUserPercentages(userId, percentages) {
  try {
    const updateFields = {};

    if (percentages.dagpacketPercentaje !== undefined) {
      updateFields.dagpacketPercentaje = percentages.dagpacketPercentaje;
    }
    if (percentages.servicesPercentaje !== undefined) {
      updateFields.servicesPercentaje = percentages.servicesPercentaje;
    }
    if (percentages.recharguesPercentage !== undefined) {
      updateFields.recharguesPercentage = percentages.recharguesPercentage;
    }
    if (percentages.packingPercentage !== undefined) {
      updateFields.packingPercentage = percentages.packingPercentage;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error("Usuario no encontrado");
    }

    return updatedUser;
  } catch (error) {
    throw error;
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
  addUserRole,
  deactivateAccount,
  activateAccount,
  updateProfilePicture,
  userProfile,
  getPorcentage,
  passwordResetService,
  adminUpdateUser,
  assignParentUser,
  getPotentialParentUsers,
  updateUserPercentages,
  addRole,
  getDeliveryUser,
  asignShipmentToUser,
};
