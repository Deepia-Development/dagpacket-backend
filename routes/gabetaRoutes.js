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

router.get("/gabeta-aviable/:id", async (req, res) => {
  GabetaController.getGabetaAviable(req, res);
});

router.post("/recolect-package", async (req, res) => {
  GabetaController.recolectPackage(req, res);
});

router.patch("/update-saturation", async (req, res) => {
  GabetaController.updateSaturation(req, res);
});

router.patch("/update-saturationOnReceive", async (req, res) => {
  GabetaController.updateGabetaSaturationOnReceive(req, res);
});

router.post("/create-size", async (req, res) => {
  GabetaController.createSize(req, res);
});

router.get("/list-size", async (req, res) => {
  GabetaController.getGavetaSize(req, res);
});

router.patch("/update-status/:_id", async (req, res) => {
  GabetaController.updateGavetaStatus(req, res);
});

router.get("/info/:_id", async (req, res) => {
  GabetaController.InfoGabetaById(req, res);
});


router.post("/delete", async (req, res) => {
  GabetaController.deleteGaveta(req, res);
});

module.exports = router;
