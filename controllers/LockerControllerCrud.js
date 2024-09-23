const LockerService = require("../services/LockerService");

async function createLocker(req, res) {
  try {
    const Locker = await LockerService.createLocker(req, res);
    res.status(200).json(Locker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function listLockers(req, res) {
  try {
    const Locker = await LockerService.listLockers(req, res);
    res.status(200).json(Locker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
createLocker,
listLockers,
};