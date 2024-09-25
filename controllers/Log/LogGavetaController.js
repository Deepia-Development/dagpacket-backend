const LogGavetaService = require("../../services/Log/LogGavetasServices");

async function createLogGaveta(req, res) {
  try {
    const logGaveta = await LogGavetaService.createLogGaveta(req, res);
    res.status(200).json(logGaveta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


async function getLogGavetas(req, res) {
  try {
    const logGaveta = await LogGavetaService.getLogGavetas(req, res);
    res.status(200).json(logGaveta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  createLogGaveta,
  getLogGavetas,
};