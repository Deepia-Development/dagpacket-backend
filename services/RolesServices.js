const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const RoleModel = require("../models/RolesModel");

async function create(req) {
  try {
    const roleExists = await RoleModel.findOne({
      role_name: req.body.role_name,
    });

    if (roleExists) return errorResponse("Ya existe un rol con ese nombre");

    const { role_name, has_wallet, type, permissions } = req.body;
    console.log(req.body);
    const Role = await RoleModel.create({
      role_name,
      has_wallet,
      type,
      permissions,
    });
    await Role.save();
    if (Role) {
      return successResponse("Rol creado correctamente");
    }
  } catch (error) {
    console.log(error);
    return errorResponse("No se pudo crear el rol: ");
  }
}

async function addPermission(req) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const Role = await RoleModel.findOneAndUpdate(
      { _id: id },
      { permissions },
      { new: true }
    );

    if (Role) {
      return successResponse("Permisos actualizados");
    }
  } catch (error) {
    console.log(error);
    return errorResponse("No se pudieron actualizar los permisos");
  }
}

async function update(req) {
  try {
    const { id } = req.params;
    const { role_name, has_wallet, type } = req.body;
    console.log(req.body);
    const Role = await RoleModel.findOneAndUpdate(
      { _id: id },
      { role_name, has_wallet, type },
      { new: true }
    );

    console.log(Role);
    if (Role) {
      return successResponse("Role actualizado");
    }
  } catch (error) {
    console.log(error);
    return errorResponse("No se pudo actualizar el rol");
  }
}

async function listRoles() {
  try {
    const Role = await RoleModel.find();
    return dataResponse("Roles", Role);
  } catch (error) {
    console.log("Error al obtener los roles: " + error);
    return errorResponse("Error al obtener los roles");
  }
}

async function getRoleById(req) {
  try {
    const { id } = req.params;
    
    const Role = await RoleModel.findById(id);

    if (!Role) {
        return errorResponse("No se encontro el rol");
    }
    
    return dataResponse("Role", Role);
  } catch (error) {
    console.log("Error al obtener el rol: " + error);
    return errorResponse("Error al obtener el rol");
  }
}

async function getRoleByName(req) {
  try {
    const { role_name } = req.params;
    
    const Role = await RoleModel.findOne({ role_name });

    if (!Role) {
        return errorResponse("No se encontro el rol");
    }
    
    return dataResponse("Role", Role);
  } catch (error) {
    console.log("Error al obtener el rol: " + error);
    return errorResponse("Error al obtener el rol");
  }
}

module.exports = {
  create,
  update,
  listRoles,
  addPermission,
  getRoleById,
  getRoleByName
};
