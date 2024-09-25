const GabetaService = require("../services/GabetaService");

async function createGabeta(req, res) {
  try {
    const Gabeta = await GabetaService.createGabeta(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function listGabetas(req, res) {
  try {
    const Gabeta = await GabetaService.listGabetas(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getGabetaInfoByLockerId(req, res) {
  try {
    const Gabeta = await GabetaService.getGabetaByIdLocker(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getGabetaAviable(req, res) {
  try {
    const Gabeta = await GabetaService.getAviableGabeta(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function recolectPackage(req, res) {
  try {
    const Gabeta = await GabetaService.recolectPackage(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function updateSaturation(req, res) {
  try {
    const Gabeta = await GabetaService.UpdateGabeta(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  createGabeta,
  listGabetas,
  getGabetaInfoByLockerId,
  getGabetaAviable,
  recolectPackage,
  updateSaturation,
};
