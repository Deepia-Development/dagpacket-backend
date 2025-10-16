const soloEnviosService = require("../services/soloEnvios");

async function getProducts(req, res) {
  try {
    const products = await soloEnviosService.getProducts(req);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
}
module.exports = {
  getProducts,
};
