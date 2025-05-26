const BillServices = require("../services/BillService");

class BillController {
  async createBill(req, res) {
    try {
      const response = await BillServices.createBill(req);
      if (response.error) {
        return res.status(400).json({ message: response.message });
      }
      return res.status(201).json(response);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async verifyBill(req, res) {
    try {
      const shipment_id = req.params.id;
      const response = await BillServices.verifyBillExists(shipment_id);
      if (response.error) {
        return res.status(400).json({ message: response });
      }
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getBillInfoFacturama(req, res) {
    try {
      const response = await BillServices.getBillInfoFacturama(req);
      if (response.error) {
        return res.status(400).json({ message: response.message });
      }
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new BillController();
