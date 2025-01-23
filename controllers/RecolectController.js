const RecolectService = require("../services/RecolectService");

const createRecolect = async (req, res) => {
    // console.log('Request body:', req.body);
  try {
    const recolect = await RecolectService.createRecolect(req);
    res.json(recolect);
  } catch (error) {
    console.error("Error in createRecolect controller:", error);
    res.status(500).json({
      error: "Error creating recolect",
      message: error.message,
    });
  }
};


const getAllRecolects = async (req, res) => {
  try {
    const recolects = await RecolectService.getAllRecolects();
    res.json(recolects);
  } catch (error) {
    console.error("Error in getAllRecolects controller:", error);
    res.status(500).json({
      error: "Error getting recolects",
      message: error.message,
    });
  }
}

const getRecolectsByUser = async (req, res) => {
  try {
    const recolects = await RecolectService.getRecolectsByUser(req.params.userId);
    res.json(recolects);
  } catch (error) {
    console.error("Error in getRecolectsByUser controller:", error);
    res.status(500).json({
      error: "Error getting recolects by user",
      message: error.message,
    });
  }
}

module.exports = {
  createRecolect,
  getAllRecolects,
  getRecolectsByUser
};
