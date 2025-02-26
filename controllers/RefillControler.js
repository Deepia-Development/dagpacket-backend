const refillRequestService = require("../services/RefillRequestService");

async function createRefillRequest(req, res) {
  try {
    const result = await refillRequestService.createRefillRequest(req);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function approveRefillRequest(req, res) {
  try {
    const result = await refillRequestService.approveRefillRequest(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function approveTransferRequest(req, res) {
  try {
    const result = await refillRequestService.approveTransferRequest(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}
async function createTransferRequest(req, res) {
  try {
    const result = await refillRequestService.createTransferRequest(req);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getTransactions(req, res) {
  try {
    const result = await refillRequestService.getTransactions(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}

async function getUserInventory(req, res) {
  try{
    const result = await refillRequestService.getUserInventory(req);
    if(result.success){
      res.status(200).json(result);
    }else{
      res.status(400).json(result);
    }
  }catch(error){
    res.status(500).json({success: false, message: "Error interno del servidor"});
  }
}

async function getTransactionsByUser(req, res) {
  try {
    const result = await refillRequestService.getTransactionByUser(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}

async function utilitie_package_dag(req,res){
  try{
    const result = await refillRequestService.utilitie_package_dag(req);
    if(result.success){
      res.status(200).json(result);
    }else{
      res.status(400).json(result);
    }
  }catch(error){ 
    res.status(500).json({success: false, message: "Error interno del servidor"});
  }
}

async function utilitie_package_lic(req,res){
  try{
    const result = await refillRequestService.utilitie_package_by_user(req);
    if(result.success){
      res.status(200).json(result);
    }else{
      res.status(400).json(result);
    }
  }catch(error){ 
    res.status(500).json({success: false, message: "Error interno del servidor"});
  }
}


async function sellPackage(req, res) {
  try {
    const result = await refillRequestService.sellPackage(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function rejectRefillRequest(req, res) {
  try {
    const result = await refillRequestService.rejectRefillRequest(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getAllUsersInventory(req, res) {
  try {
    const result = await refillRequestService.getAllUsersInventory(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}
async function rejectTransferRequest(req, res) {
  try {
    const result = await refillRequestService.rejectTransferRequest(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

// Función adicional para obtener las solicitudes de reabastecimiento
async function getRefillRequests(req, res) {
  try {
    const result = await refillRequestService.getRefillRequests(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getUserRefillRequests(req, res) {
  try {
    const result = await refillRequestService.getUserRefillRequests(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getTransferRequests(req, res) {
  try {
    const result = await refillRequestService.getTransferRequests(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

async function getUserTransferRequests(req, res) {
  try {
    const result = await refillRequestService.getUserTransferRequests(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

module.exports = {
  createRefillRequest,
  approveRefillRequest,
  rejectRefillRequest,
  getRefillRequests,
  sellPackage,
  createTransferRequest,
  getUserTransferRequests,
  getTransferRequests,
  getUserRefillRequests,
  approveTransferRequest,
  rejectTransferRequest,
  getAllUsersInventory,
  utilitie_package_lic,
  utilitie_package_dag,
  getTransactions,
  getTransactionsByUser,
  getUserInventory
};
