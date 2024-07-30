const CancellationController = require('../controllers/CancellattionRequestController');
const router = require('express').Router();

router.post('/request',  async (req, res) => {
    CancellationController.createCancellationRequest(req, res);
})

router.get('/:id', async (req, res) => {
    CancellationController.getCancellationRequests(req, res);
})

module.exports = router;