const TrackingController = require('../controllers/TrackingController');
const router = require('express').Router();

router.post('/create', async (req, res) => {
    TrackingController.createTracking(req, res);
})

router.get('/tracking/:id', async (req, res) => {
    TrackingController.getTrackingShipment(req, res);
})

module.exports = router;