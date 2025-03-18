const UserModel = require("../models/UsersModel");
const EmployeesModel = require("../models/EmployeesModel");
const CashRegisterModel = require("../models/CashRegisterModel");
const CashTransactionModel = require("../models/CashTransactionModel");
const {
  openCashRegister,
  closeCashRegister,
} = require("../services/CashRegisterService");
const CashRegisterService = require("../services/CashRegisterService");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

exports.openCashRegister = async (req, res) => {
  try {
    const userId = req.user.user._id; // Accedemos al ID correctamente
    const userRole = req.user.user.role;

    const cashRegister = await openCashRegister(userId, userRole);
    res.status(200).json(cashRegister);
  } catch (error) {
    console.error("Error al abrir caja:", error);
    res.status(400).json(errorResponse(error.message));
  }
};

exports.closeCashRegisterForCashier = async (req, res) => {
  try {
    const userId = req.user.user._id;

    const cashRegister = await CashRegisterService.closeCashRegisterForCashier(userId);
    res.status(200).json(cashRegister);
  } catch (error) {
    console.error("Error al cerrar caja:", error);
    res.status(400).json(errorResponse(error.message));
  }
}

exports.getCashRegisterByLicenseId = async (req, res) => {
  try {
    const result = await CashRegisterService.getAllCashRegistersByLicenseId(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error en getAllCashRegisters controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};


exports.getCashRegisterByParentUser = async (req, res) => {
  try {
    const result = await CashRegisterService.getCashRegistersByParentUser(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error en getAllCashRegisters controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

exports.getTransactionsForCashRegisters = async (req, res) => {
  try {
    const result = await CashRegisterService.getTransactionsForCashRegisters(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error en getAllCashRegisters controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};
exports.getCurrentCashRegister = async (req, res) => {
  try {
    const userId = req.user.user._id;
    console.log("Buscando caja para el usuario:", userId);

    const cashRegister = await CashRegisterModel.findOne({
      $or: [
        { licensee_id: userId, status: "open" },
        { opened_by: userId, status: "open" },
      ],
    }).populate({
      path: "opened_by",
      model: "Users",
      select: "name email",
    });

    console.log("Caja encontrada:", cashRegister);

    if (cashRegister) {
      res.json(await dataResponse("Caja actual encontrada", cashRegister));
    } else {
      res.json(await successResponse("No hay caja abierta actualmente"));
    }
  } catch (error) {
    console.error("Error al obtener la caja actual:", error);
    res
      .status(500)
      .json(await errorResponse("Error al obtener la caja actual"));
  }
};

exports.closeCashRegister = async (req, res) => {
  try {
    const userId = req.user.user._id;

    const result = await closeCashRegister(userId);

    res.json(result);
  } catch (error) {
    console.error("Error al cerrar la caja:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error al cerrar la caja",
    });
  }
};

exports.closeCashRegisterById = async (req, res) => {
  try {
    const cashRegister = await CashRegisterService.closeCashRegisterById(req);

    if (!cashRegister.success) {
      return res.status(404).json({ success: false, message: cashRegister.message });
    }

    res.status(200).json(cashRegister);
  } catch (error) {
    console.error("Error en getCashRegisterById:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

exports.hasOpenCashRegister = async (req, res) => {
  try{  
    const response = await CashRegisterService.hasOpenCashRegister(req);
    if(response.success){
      res.status(200).json(response);
    }else{
      res.status(400).json(response);
    }
 
  }catch(error){
    console.error("Error en hasOpenCashRegister:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

exports.getCashTransactions = async (req, res) => {
  try {
    const userId = req.user.user._id;

    // Buscar la caja abierta actual
    const currentCashRegister = await CashRegisterModel.findOne({
      $or: [
        { opened_by: userId, status: "open" },
        { licensee_id: userId, status: "open" },
      ],
    });

    if (!currentCashRegister) {
      return res
        .status(404)
        .json(await errorResponse("No hay caja abierta actualmente"));
    }

    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Contar total de transacciones
    const totalTransactions = await CashTransactionModel.countDocuments({
      cash_register_id: currentCashRegister._id,
    });

    // Obtener transacciones paginadas
    const transactions = await CashTransactionModel.find({
      cash_register_id: currentCashRegister._id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "operation_by", // Campo del modelo CashTransaction que referencia al usuario
        model: "Users", // Modelo al que hace referencia
        select: "name email", // Campos específicos que deseas incluir
      })
      .lean()
      .skip(skip)
      .limit(limit);

    //console.log('Transacciones encontradas:', transactions);

    const totalPages = Math.ceil(totalTransactions / limit);

    const responseData = {
      transactions,
      currentPage: page,
      totalPages,
      totalTransactions,
      limit,
    };

    res.json(
      await dataResponse("Transacciones obtenidas exitosamente", responseData)
    );
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    res
      .status(500)
      .json(await errorResponse("Error al obtener las transacciones"));
  }
};

exports.getAllCashRegisters = async (req, res) => {
  try {
    const result = await CashRegisterService.getAllCashRegisters(req);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error en getAllCashRegisters controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};
