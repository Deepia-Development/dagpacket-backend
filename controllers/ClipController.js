const ClipService = require("../services/ClipService");

class ClipController {
  async getClip(req, res) {
    try {
      const clip = await ClipService.getClip();
      return res.status(200).json(clip);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async refoundClip(req, res) {
    try {
      const clip = await ClipService.refoundClip(req);
      return res.status(200).json(clip);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}


module.exports = new ClipController();