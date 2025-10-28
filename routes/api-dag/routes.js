const express = require("express");
const router = express.Router();
const axios = require("axios");
const { dagpacketAuth } = require("../../middlewares/api-dag/dagpacket-auth");
const config = require("../../config/config");

const BASE_URL = config.apiDagpacket.apiUrl;


router.get("/users", dagpacketAuth, async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/get`, {
      headers: { Authorization: `Bearer ${req.dagpacketToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error consumiendo Dagpacket:", error.response?.data || error.message);
    res.status(500).json({ error: "Error comunicándose con Dagpacket" });
  }
});


router.get("/users/:id", dagpacketAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${BASE_URL}/users/get/${id}`, {
      headers: { Authorization: `Bearer ${req.dagpacketToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error consumiendo Dagpacket:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Error consultando usuario en Dagpacket",
    });
  }
});


router.put("/users/:id", dagpacketAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const response = await axios.put(`${BASE_URL}/users/update/${id}`, body, {
      headers: { Authorization: `Bearer ${req.dagpacketToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error consumiendo Dagpacket:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Error actualizando usuario en Dagpacket",
    });
  }
});


router.patch("/users/add-funds/:id", dagpacketAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const response = await axios.patch(`${BASE_URL}/users/add-funds/${id}`, body, {
      headers: { Authorization: `Bearer ${req.dagpacketToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error consumiendo Dagpacket:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Error agregando fondos al usuario en Dagpacket",
    });
  }
});

module.exports = router;
