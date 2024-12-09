const PublicityLockerService = require('../services/PublicityLockerService');

exports.create = async (req, res) => {
  console.log('PublicityLockerController.create', req.body);
  const result = await PublicityLockerService.createPublicity(req);
  console.log('PublicityLockerController.create result', result);
  if (result.success) {
    lastCreatedPublicity = req.body;
  }
  res.json(result);
};

exports.getById = async (req, res) => {
  try {
    
    const publicity = await PublicityLockerService.getPublicityById(req);
    if (publicity) {
      res.status(200).json({ success: true, data: publicity });
    } else {
      res.status(404).json({ success: false, message: 'Publicity not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getByLocker = async (req, res) => {
  try {
    const { lockerId } = req.params;
    const publicity = await PublicityLockerService.getPublicityByLocker(lockerId);
    res.status(200).json(publicity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { lockerId, advertisementId } = req.params;
    const result = await PublicityLockerService.updateAdvertisement(
      lockerId,
      advertisementId,
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { lockerId, advertisementId } = req.params;
    const result = await PublicityLockerService.deleteAdvertisement(
      lockerId,
      advertisementId
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};