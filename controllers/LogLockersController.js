const LockerLogin = require("../services/LoginLockerService");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function create(req, res) {
  try {
    const User = await LockerLogin.create(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const User = await LockerLogin.login(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function verifyToken(req, res) {
  try {
    const User = await LockerLogin.getIdByToken(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


async function getUserLockerById(req, res) {
  try {
    const User = await LockerLogin.getUserLockerById(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function generateNewPassword(req, res) {
  try {
    const User = await LockerLogin.generateNewPassword(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function editUserInfo(req, res) {
  try {
    const User = await LockerLogin.editUserInfo(req, res);
    res.status(200).json(User);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  editUserInfo,
  generateNewPassword,
  create,
  login,
  verifyToken,
  getUserLockerById,
};
