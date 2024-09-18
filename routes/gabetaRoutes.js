const express = require("express");
const router = express.Router();
const GabetaController = require("../controllers/GabetaController");

router.post("/create", async (req, res) => {
  GabetaController.createGabeta(req, res);
});

router.get("/list", async (req, res) => {
  GabetaController.listGabetas(req, res);
});


module.exports = router;