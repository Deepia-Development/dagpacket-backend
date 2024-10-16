const GabetaService = require("../services/GabetaService");
const GabetaSizeService = require("../services/gavetaSizeService");

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

// Controlador (sin manejar la respuesta)
async function recolectPackage(req, res) {
  await GabetaService.recolectPackage(req, res);
}


async function updateSaturation(req, res) {
  console.log(req.body);
  try {
    // Llama al servicio y deja que este maneje la respuesta
    await GabetaService.updateSaturation(req, res); 
  } catch (error) {
    // Si ocurre un error fuera del servicio, se maneja aquí
    res.status(400).json({ message: error.message });
  }
}


async function createSize(req, res) {
  try {
    const Gabeta = await GabetaSizeService.createGavetaSize(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


async function getGavetaSize(req, res) {
  try {
    const Gabeta = await GabetaSizeService.listGavetaSize(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function deleteGaveta(req, res) {
  try {
    const Gabeta = await GabetaService.deleteGaveta(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


async function updateGavetaStatus(req, res) {
  try {
    const Gabeta = await GabetaService.UpdateGabetaStatus(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


async function InfoGabetaById(req, res) {
  try {
    const Gabeta = await GabetaService.getGavetaInfoById(req, res);
    res.status(200).json(Gabeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
module.exports = {
  InfoGabetaById,
  createGabeta,
  listGabetas,
  getGabetaInfoByLockerId,
  getGabetaAviable,
  recolectPackage,
  updateSaturation,
  createSize,
  getGavetaSize,
  updateGavetaStatus,deleteGaveta
};
