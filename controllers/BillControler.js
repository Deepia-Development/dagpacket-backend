const BillService = require("../services/BillService");

async function createBill(req, res) {
  try {
    const transactions = await BillService.createBill(req);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function getBill(req, res) {
  try {
    const bill = await BillService.getBills(req);
    if (bill) {
      res.status(200).json(bill);
    } else {
      res.status(404).json({ message: "Bill not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getBillById(req, res) {
    try {
        const bill = await BillService.getBillById(req);
        if (bill) {
        res.status(200).json(bill);
        } else {
        res.status(404).json({ message: "Bill not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function updateBill(req, res) {
  try {
    const bill = await BillService.updateBill(req);
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function deleteBill(req, res) {
    try {
        const bill = await BillService.deleteBill(req);
        res.status(200).json(bill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    }



module.exports = {
    createBill,
    getBill,
    getBillById,
    updateBill,
    deleteBill,
    };