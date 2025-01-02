const UserService = require("../services/UserService");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function create(req, res) {
  try {
    const User = await UserService.create(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function addAddress(req, res) {
  try {
    const User = await UserService.addAddress(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const User = await UserService.login(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getUsers(req, res) {
  try {
    const result = await UserService.listUsers(req);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en getUsers controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getDeliveryUsers(req, res) {
  try {
    const result = await UserService.getDeliveryUser(req);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en getUsers controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function asignShipmentToUser(req, res) {
  try {
    const User = await UserService.asignShipmentToUser(req, res);
    res.status(200).json(User);
  } catch (error) {
    return;
  }
}

async function update(req, res) {
  try {
    const User = await UserService.update(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function addPin(req, res) {
  try {
    const User = await UserService.addPin(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const User = await UserService.changePassword(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function addRole(req, res) {
  try {
    const User = await UserService.addRole(req, res);
    console.log(User);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function deactivateAccount(req, res) {
  try {
    const User = await UserService.deactivateAccount(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function activateAccount(req, res) {
  try {
    const User = await UserService.activateAccount(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function updateProfilePicture(req, res) {
  try {
    const User = await UserService.updateProfilePicture(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function userProfile(req, res) {
  try {
    const User = await UserService.userProfile(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getPorcentage(req, res) {
  try {
    const User = await UserService.getPorcentage(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function requestReset(req, res) {
  try {
    const { email } = req.body;
    const resetService = await UserService.passwordResetService();
    const result = await resetService.requestPasswordReset(email);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const resetService = await UserService.passwordResetService();
    const result = await resetService.resetPassword(token, newPassword);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function updateUserAdmin(req, res) {
  try {
    const result = await UserService.adminUpdateUser(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function assignParentUser(req, res) {
  const result = await UserService.assignParentUser(req);
  res.status(result.success ? 200 : 400).json(result);
}

async function getPotentialParentUsers(req, res) {
  try {
    const result = await UserService.getPotentialParentUsers();
    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error en el controlador al obtener usuarios potenciales:",
      error
    );
    res.status(500).json(errorResponse("Error interno del servidor"));
  }
}

async function addUserRole(req, res) {
  console.log("addUserRole");
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json(errorResponse("Se requiere userId y role"));
    }

    const result = await UserService.addUserRole(userId, role);

    if (result.success) {
      res.status(200).json(result);
    } else {
      console.log("Error en el controlador al asignar rol:", result);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error en el controlador al asignar rol:", error);
    res.status(500).json(errorResponse("Error interno del servidor"));
  }
}

async function updateStatuDelivery(req, res) {
  try {
    const updatedUser = await UserService.updateStatuDelivery(req);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function deliveryShipments(req, res) {
  try {
    const shipments = await UserService.deliveryShipments(req);
    res.status(200).json(shipments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function updatePercentages(req, res) {
  try {
    const { userId } = req.params;
    const percentages = req.body;

    const updatedUser = await UserService.updateUserPercentages(
      userId,
      percentages
    );

    res.status(200).json({
      success: true,
      message: "Porcentajes actualizados con éxito",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  create,
  addAddress,
  login,
  getUsers,
  update,
  addPin,
  changePassword,
  addRole,
  deactivateAccount,
  activateAccount,
  updateProfilePicture,
  userProfile,
  getPorcentage,
  requestReset,
  resetPassword,
  updateUserAdmin,
  assignParentUser,
  getPotentialParentUsers,
  addUserRole,
  updatePercentages,
  getDeliveryUsers,
  asignShipmentToUser,
  updateStatuDelivery,
  deliveryShipments
};
