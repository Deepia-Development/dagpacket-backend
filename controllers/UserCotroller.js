const UserSevice = require('../services/UserService');

async function create(req, res){
    try {
        const User = await UserSevice.create(req, res);
        res.status(200).json(User)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function addAddress(req, res){
    try {
        const User = await UserSevice.addAddress(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function login(req, res){
    try {
        const User = await UserSevice.login(req ,res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listUsers(req, res){
    try {
        const User = await UserSevice.listUsers(req, res);
        res.status(200).json(User);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    create, 
    addAddress,
    login,
    listUsers
}