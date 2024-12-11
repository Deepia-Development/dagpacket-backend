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

module.exports = {
  createRecolect,
};
