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

module.exports = {
  createGabeta,
  listGabetas,
};
