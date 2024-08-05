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

async function getUsers(req, res) {
    try {
        const result = await UserService.listUsers(req);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error en getUsers controller:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
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

async function getPorcentage(req, res){
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
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
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
    resetPassword
}