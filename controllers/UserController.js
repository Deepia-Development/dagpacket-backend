const UserService = require('../services/UserService');

async function create(req, res){
    try {
        const User = await UserService.create(req, res);
        res.status(200).json(User)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function addAddress(req, res){
    try {
        const User = await UserService.addAddress(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function login(req, res){
    try {
        const User = await UserService.login(req ,res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listUsers(req, res){
    try {
        const User = await UserService.listUsers(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function update(req, res){
    try {
        const User = await UserService.update(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({message: error.message });
    }
}

async function addPin(req, res){
    try {
        const User = await UserService.addPin(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function changePassword(req, res){
    try {
        const User = await UserService.changePassword(req, res);
        res.status(200).json(User);   
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function addRole(req, res){
    try {
        const User = await UserService.addRole(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function deactivateAccount(req, res){
    try {
        const User = await UserService.deactivateAccount(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function activateAccount(req, res){
    try {
        const User = await UserService.activateAccount(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function updateProfilePicture(req, res){
    try {
        const User = await UserService.updateProfilePicture(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function userProfile(req, res){
    try {
        const User = await UserService.userProfile(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    create, 
    addAddress,
    login,
    listUsers,
    update,
    addPin,
    changePassword,
    addRole,
    deactivateAccount,
    activateAccount,
    updateProfilePicture,
    userProfile
}