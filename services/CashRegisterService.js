// services/cashRegisterService.js
const CashRegisterModel = require("../models/CashRegisterModel");
const CashTransactionModel = require("../models/CashTransactionModel");
const UserModel = require("../models/UsersModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");

async function getAllCashRegisters(req) {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (startDate && endDate) {
      query.opened_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalRegisters = await CashRegisterModel.countDocuments(query);
    const totalPages = Math.ceil(totalRegisters / limit);

    const cashRegisters = await CashRegisterModel.find(query)
      .sort({ opened_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "opened_by",
        model: "Users",
        select: "name email",
      })
      .lean();

    console.log("Cajas encontradas:", cashRegisters);
    //console.log('Total de cajas:', totalRegisters);
    const cashRegistersWithTransactions = await Promise.all(
      cashRegisters.map(async (register) => {
        const transactions = await CashTransactionModel.find({
          cash_register_id: register._id,
        })
          .sort({ createdAt: -1 })
          .populate({
            path: "operation_by",
            model: "Users", // Ensure this matches your User model name
            select: "name email", // Select specific fields you want
          })
          .lean();

        console.log(
          "Transacciones encontradas para la caja:",
          register._id,
          transactions
        );

        return {
          ...register,
          transactions,
        };
      })
    );

    return dataResponse("Registros de caja obtenidos exitosamente", {
      cashRegisters: cashRegistersWithTransactions,
      currentPage: parseInt(page),
      totalPages,
      totalRegisters,
    });
  } catch (error) {
    console.error("Error al obtener los registros de caja:", error);
    return errorResponse("Error al obtener los registros de caja");
  }
}

async function getAllCashRegistersByLicenseId(req) {
  try {
    const { page = 1, limit = 10, startDate, endDate, licensee_id } = req.query;

    console.log("Filtros de búsqueda:", req.query);

    // console.log("Filtros de búsqueda:", req.query);
    // console.log("Licensee ID:", licensee_id);
    const skip = (page - 1) * limit;

    let query = {};

    // Filtro por licensee_id si se proporciona
    if (licensee_id) {
      query.licensee_id = licensee_id;
    }

    // Filtro por rango de fechas si se proporcionan
    if (startDate && endDate) {
      query.opened_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    console.log("Query:", query);

    const totalRegisters = await CashRegisterModel.countDocuments(query);
    const totalPages = Math.ceil(totalRegisters / limit);
    console.log(query);
    const cashRegisters = await CashRegisterModel.find(query)
      .sort({ opened_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "opened_by",
        model: "Users",
        select: "name email",
      })
      .lean();

    console.log("Cajas encontradas:", cashRegisters);

    const cashRegistersWithTransactions = await Promise.all(
      cashRegisters.map(async (register) => {
        const transactions = await CashTransactionModel.find({
          cash_register_id: register._id,
        })
          .sort({ createdAt: -1 })
          .populate({
            path: "operation_by",
            model: "Users",
            select: "name email",
          })
          .lean();

        return {
          ...register,
          transactions,
        };
      })
    );

    return dataResponse("Registros de caja obtenidos exitosamente", {
      cashRegisters: cashRegistersWithTransactions,
      currentPage: parseInt(page),
      totalPages,
      totalRegisters,
    });
  } catch (error) {
    console.error("Error al obtener los registros de caja:", error);
    return errorResponse("Error al obtener los registros de caja");
  }
}

async function getCashRegistersByParentUser(req) {
  try {
    const { page = 1, limit = 10, startDate, endDate, parentUser } = req.query;

    console.log("Filtros de búsqueda:", req.query);
    console.log("ParentUser:", parentUser);
    const skip = (page - 1) * limit;

    // Validar que se proporcione `parentUser`
    if (!parentUser) {
      return errorResponse("El parámetro parentUser es obligatorio");
    }

    // Obtener los empleados que son hijos del usuario especificado
    const childEmployees = await UserModel.find({ parentUser })
      .select("_id")
      .lean();

    const employeeIds = childEmployees.map((employee) => employee._id);

    if (employeeIds.length === 0) {
      return dataResponse(
        "No se encontraron empleados asociados al usuario especificado",
        {
          cashRegisters: [],
          currentPage: parseInt(page),
          totalPages: 0,
          totalRegisters: 0,
        }
      );
    }

    // Construir la consulta para los registros de caja
    let query = { opened_by: { $in: employeeIds } };

    // Filtro por rango de fechas si se proporcionan
    if (startDate && endDate) {
      query.opened_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalRegisters = await CashRegisterModel.countDocuments(query);
    const totalPages = Math.ceil(totalRegisters / limit);

    const cashRegisters = await CashRegisterModel.find(query)
      .sort({ opened_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "opened_by",
        model: "Users",
        select: "name email",
      })
      .lean();

    console.log("Cajas encontradas:", cashRegisters);
    console.log("Total de cajas:", totalRegisters);

    const cashRegistersWithTransactions = await Promise.all(
      cashRegisters.map(async (register) => {
        const transactions = await CashTransactionModel.find({
          cash_register_id: register._id,
        })
          .sort({ createdAt: -1 })
          .populate({
            path: "operation_by",
            model: "Users",
            select: "name email",
          })
          .lean();

        return {
          ...register,
          transactions,
        };
      })
    );

    return dataResponse("Registros de caja obtenidos exitosamente", {
      cashRegisters: cashRegistersWithTransactions,
      currentPage: parseInt(page),
      totalPages,
      totalRegisters,
    });
  } catch (error) {
    console.error("Error al obtener los registros de caja:", error);
    return errorResponse("Error al obtener los registros de caja");
  }
}

// Funcion imcompleta
async function getTransactionsForCashRegisters(req) {
  try {
    const { page = 1, limit = 10, startDate, endDate, parentUser } = req.query;

    console.log("Filtros de búsqueda:", req.query);

    const skip = (page - 1) * limit;

    // Validar que se proporcione `parentUser`
    if (!parentUser) {
      return errorResponse("El parámetro parentUser es obligatorio");
    }

    // Obtener los empleados que son hijos del usuario especificado
    const childEmployees = await UserModel.find({ parentUser })
      .select("_id")
      .lean();

    const employeeIds = childEmployees.map((employee) => employee._id);

    if (employeeIds.length === 0) {
      return dataResponse(
        "No se encontraron empleados asociados al usuario especificado",
        {
          transactions: [],
          currentPage: parseInt(page),
          totalPages: 0,
          totalTransactions: 0,
        }
      );
    }

    // Construir la consulta para las transacciones de caja
    let query = { operation_by: { $in: employeeIds } };

    // Filtro por rango de fechas si se proporcionan
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalTransactions = await CashTransactionModel.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    // Obtener las transacciones
    const transactions = await CashTransactionModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "operation_by",
        model: "Users",
        select: "name email", // Solo traer información del usuario que realizó la operación
      })
      .lean();

    console.log("Transacciones encontradas:", transactions);

    // Crear un nuevo objeto solo con los detalles de las transacciones
    const transactionsWithDetails = transactions.map((transaction) => {
      const { name, email } = transaction.operation_by; // Info del usuario que realizó la operación

      return {
        transaction_id: transaction._id,
        transaction_date: transaction.createdAt,
        amount: transaction.amount, // Agregar los campos relevantes de la transacción
        operation_by_name: name,
        operation_by_email: email,
        operation_date: transaction.createdAt,
      };
    });

    //console.log('Transacciones con detalles:', transactionsWithDetails);
    console.log("Transacciones con detalles:", transactionsWithDetails);
    console.log("Total de transacciones:", totalTransactions);
    console.log("Página actual:", page);

    return dataResponse("Transacciones obtenidas exitosamente", {
      transactions: transactionsWithDetails,
      currentPage: parseInt(page),
      totalPages,
      totalTransactions,
    });
  } catch (error) {
    console.error("Error al obtener las transacciones:", error);
    return errorResponse("Error al obtener las transacciones");
  }
}

async function openCashRegister(userId) {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    console.log("Usuario intentando abrir caja:", user.role, user._id);

    // Verificar si ya existe una caja abierta
    const existingOpenRegister = await CashRegisterModel.findOne({
      opened_by: user._id,
      status: "open",
    });

    console.log("Caja abierta encontrada:", existingOpenRegister);

    if (existingOpenRegister) {
      throw new Error("Ya existe una caja abierta");
    }

    // Función recursiva para encontrar el usuario con la licencia
    const findLicensee = async (currentUser) => {
      if (!currentUser.parentUser) {
        return currentUser; // No tiene usuario padre, este usuario tiene la licencia
      }
      const parent = await UserModel.findById(currentUser.parentUser);
      if (!parent) {
        throw new Error("Usuario padre no encontrado");
      }
      console.log("Usuario padre encontrado:", parent);
      return await findLicensee(parent); // Recursivamente buscar al usuario sin padre
    };

    // Buscar al usuario con la licencia (sin un usuario padre)
    const licenseeUser = await findLicensee(user);

    // Crear una nueva caja
    const newCashRegister = new CashRegisterModel({
      licensee_id: licenseeUser._id, // El usuario con la licencia
      employee_id: user.role === "CAJERO" ? user._id : undefined,
      opened_by: user._id,
      user_type: user.role,
    });

    const savedCashRegister = await newCashRegister.save();

    const populatedCashRegister = await savedCashRegister.populate({
      path: "opened_by",
      model: "Users",
      select: "name email",
    });

    console.log("Nueva caja abierta:", populatedCashRegister);

    return {
      success: true,
      message: "Caja abierta exitosamente",
      data: {
        _id: populatedCashRegister._id,
        opened_at: populatedCashRegister.opened_at,
        opened_by: {
          _id: populatedCashRegister.opened_by._id,
          name: populatedCashRegister.opened_by.name,
          email: populatedCashRegister.opened_by.email,
        },
        userType: populatedCashRegister.user_type,
        licenseeId: populatedCashRegister.licensee_id,
        employeeId: populatedCashRegister.employee_id,
        total_sales: populatedCashRegister.total_sales,
      },
    };
  } catch (error) {
    console.error("Error al abrir la caja:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

async function closeCashRegisterById(req) {
  try {
    const { id } = req.params;

    const result = await CashRegisterModel.findByIdAndUpdate(
      id,
      { status: "closed" }, // Corrección: aquí se pasa el objeto con los datos a actualizar
      { new: true } // Esto hace que Mongoose retorne el documento actualizado
    );

    if (!result) {
      throw new Error("No se encontró la caja con el ID proporcionado");
    }

    return {
      success: true,
      message: "Caja cerrada exitosamente",
      data: result,
    };
  } catch (error) {
    console.error("Error al cerrar la caja:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

async function hasOpenCashRegister(req) {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    console.log("Verificando si el usuario tiene una caja abierta:", user._id);

    const cashRegister = await CashRegisterModel.findOne({
      $or: [
        { opened_by: user._id, status: "open" },
      ],
    });

    if (cashRegister) {
      // Verificar si la caja lleva abierta más de 24 horas
      const openedAt = new Date(cashRegister.opened_at);
      const currentTime = new Date();
      const diffInHours = (currentTime - openedAt) / (1000 * 60 * 60); // Diferencia en horas
      
      if (diffInHours >= 24) {
        return successResponse(`Caja abierta desde hace ${Math.floor(diffInHours)} horas. Debe cerrarla.`);
      }
      
      return successResponse("Caja actual encontrada");
    }

    return successResponse("No hay caja abierta actualmente");
  } catch (error) {
    console.error("Error al verificar caja abierta:", error);
    return false;
  }
}

async function closeCashRegister(userId) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  console.log("Buscando caja abierta para el usuario:", user._id);

  // Find the open cash register for this user
  const cashRegister = await CashRegisterModel.findOne({
    $or: [
      {
        employee_id: user._id,
        opened_by: user._id,
        status: "open",
      },
      {
        licensee_id: user._id,
        status: "open",
      },

      {
        opened_by: user._id,
        status: "open",
      },
    ],
  });

  console.log("Caja abierta encontrada:", cashRegister);

  if (!cashRegister) {
    throw new Error("No hay caja abierta para cerrar");
  }

  cashRegister.status = "closed";
  cashRegister.closed_at = Date.now();
  cashRegister.closed_by = userId;
  await cashRegister.save();

  return {
    success: true,
    message: "Caja cerrada exitosamente",
    data: {
      openedAt: cashRegister.opened_at,
      closedAt: cashRegister.closed_at,
      totalSales: cashRegister.total_sales,
      opened_by: cashRegister.opened_by,
      closedBy: cashRegister.closed_by,
    },
  };
}

module.exports = {
  openCashRegister,
  closeCashRegister,
  getAllCashRegisters,
  getAllCashRegistersByLicenseId,
  getCashRegistersByParentUser,
  getTransactionsForCashRegisters,
  closeCashRegisterById,
  hasOpenCashRegister,
};
