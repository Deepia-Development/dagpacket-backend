const express = require("express");
const router = express.Router();
const GabetaController = require("../controllers/GabetaController");

router.post("/create", async (req, res) => {
  GabetaController.createGabeta(req, res);
});

router.get("/list", async (req, res) => {
  GabetaController.listGabetas(req, res);
});

router.post("/list-by-locker", async (req, res) => {
  GabetaController.getGabetaInfoByLockerId(req, res);
});

router.get("/gabeta-aviable", async (req, res) => {
  GabetaController.getGabetaAviable(req, res);
});

router.post("/recolect-package", async (req, res) => {
  GabetaController.recolectPackage(req, res);
});


router.patch("/update-saturation", async (req, res) => {
  GabetaController.updateSaturation(req, res);
});


module.exports = router;
