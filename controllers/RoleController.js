const RoleService = require('../services/RolesServices');

async function create(req, res){
    try {
        const Role = await RoleService.create(req, res);
        res.status(200).json(Role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function addPermission(req, res){
    try {
        const Role = await RoleService.addPermission(req, res);
        res.status(200).json(Role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function update(req, res){
    try {
        const Role = await RoleService.update(req, res);
        res.status(200).json(Role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listRoles(req, res){
    try {
        const Role = await RoleService.listRoles(req, res);
        res.status(200).json(Role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    create,
    update,
    listRoles,
    addPermission
}