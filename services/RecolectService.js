
const RecolectModel = require("../models/RecolectModel");
const UserModel = require("../models/UsersModel");
const WalletService = require("./walletService");
const TransactionModel = require("../models/TransactionsModel");
const { dataResponse, errorResponse } = require("../helpers/ResponseHelper");

const createRecolect = async (req) => {
  try {
    const userId = req.body.user_id;
    const packagePrice = parseFloat(req.body.packagePrice) || 20; // Precio total del paquete
    const dagpacketProfit = parseFloat(req.body.dagpacketProfit) || 0;
    const licenciatarioProfit = parseFloat(req.body.licenciatarioProfit) || 0;

    // Obtener el rol del usuario
    const user = await UserModel.findById(userId).select('role');
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let walletMessage = '';

    // Siempre cobrar el monto total del paquete
    if (packagePrice > 0) {
      try {
        const updatedWallet = await WalletService.updateWalletBalance(userId, 'sendBalance', -packagePrice);
        console.log(`Wallet charged: $${packagePrice} from user ${userId}`);
        walletMessage = `Se cobró $${packagePrice} de tu wallet (Envios).`;

        // Registrar transacción de cobro
        const newBalance = parseFloat(updatedWallet.sendBalance.toString());
        const previousBalance = newBalance + packagePrice;

        const transaction = new TransactionModel({
          user_id: userId,
          service: "Recolección",
          transaction_number: `${Date.now()}`,
          payment_method: "Saldo",
          previous_balance: previousBalance.toFixed(2),
          amount: packagePrice.toFixed(2),
          new_balance: newBalance.toFixed(2),
          details: `Pago de recolección`,
          status: "Pagado",
        });
        await transaction.save();

      } catch (walletError) {
        console.error('Error charging wallet:', walletError.message);
        throw new Error(`No se pudo cobrar del wallet: ${walletError.message}`);
      }
    }

    // Si el usuario es COMIS_INM, retornar las ganancias a su wallet
    if (user.role === 'COMIS_INM' && licenciatarioProfit > 0) {
      try {
        const updatedWallet = await WalletService.updateWalletBalance(userId, 'sendBalance', licenciatarioProfit);
        console.log(`Profit returned: $${licenciatarioProfit} to user ${userId} (COMIS_INM)`);
        walletMessage += ` Se retornaron $${licenciatarioProfit} por tus ganancias.`;

        // Registrar transacción de devolución
        const newBalance = parseFloat(updatedWallet.sendBalance.toString());
        const previousBalance = newBalance - licenciatarioProfit;

        const transaction = new TransactionModel({
          user_id: userId,
          service: "Recolección",
          transaction_number: `${Date.now()}_refund`,
          payment_method: "Saldo",
          previous_balance: previousBalance.toFixed(2),
          amount: licenciatarioProfit.toFixed(2),
          new_balance: newBalance.toFixed(2),
          details: `Bonificación de utilidad por recolección`,
          status: "Reembolso",
        });
        await transaction.save();

      } catch (walletError) {
        console.error('Error returning profit:', walletError.message);
        // No lanzar error aquí, la recolección ya se cobró
      }
    }

    const recolectData = {
      user_id: userId,
      name: req.body.name,
      telephone: req.body.telephone,
      tracking_number: req.body.tracking_number,
      delivery: req.body.delivery,
      note: req.body.note,
      status: req.body.status,
      image64: Buffer.from(req.body.image64, 'base64'),
      dagpacketProfit: dagpacketProfit,
      licenciatarioProfit: licenciatarioProfit
    };

    const newRecolect = new RecolectModel(recolectData);
    const savedRecolect = await newRecolect.save();

    // Retornar la recolección con mensaje de wallet
    return {
      ...savedRecolect.toObject(),
      walletMessage: walletMessage
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

async function getAllRecolects(page = 1, limit = 10, searchTerm = '') {
  try {
    const skip = (page - 1) * limit;
    let filter = {};

    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { tracking_number: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const total = await RecolectModel.countDocuments(filter);
    const recolects = await RecolectModel.find(filter)
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return dataResponse('Recolecciones recuperadas con éxito', {
      recolects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total
    });

  } catch (error) {
    return errorResponse('Error al obtener recolecciones: ' + error.message);
  }
}


async function getRecolectsByUser(userId, page = 1, limit = 10, searchTerm = '') {
  try {
    const skip = (page - 1) * limit;

    // 1️⃣ Buscar cajeros (usuarios hijos de este userId)
    const cajeros = await UserModel.find({ parentUser: userId }).select('_id').lean();
    const cajeroIds = cajeros.map(c => c._id);

    // 2️⃣ Armar filtro base
    let filter = {
      $or: [{ user_id: userId }]
    };

    // 3️⃣ Si hay cajeros, agregarlos al filtro
    if (cajeroIds.length > 0) {
      filter.$or.push({ user_id: { $in: cajeroIds } });
    }

    // 4️⃣ Si hay búsqueda
    if (searchTerm) {
      filter.$and = [
        { $or: filter.$or },
        {
          $or: [
            { tracking_number: { $regex: searchTerm, $options: 'i' } },
            { delivery: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ];
      delete filter.$or; // movimos dentro de $and
    }

    // 5️⃣ Consultar total
    const total = await RecolectModel.countDocuments(filter);

    // 6️⃣ Buscar recolecciones excluyendo `image64`
    const recolects = await RecolectModel.find(filter, { image64: 0 })
      .populate('user_id', 'name') // opcional: para saber de qué usuario es
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 7️⃣ Marcar si son de cajeros
    const recolectsWithLabel = recolects.map(r => {
      const isCajero = cajeroIds.some(id => id.toString() === r.user_id._id.toString());
      return {
        ...r,
        origin: isCajero ? 'Cajeros Recolecciones' : 'Usuario Principal'
      };
    });

    return dataResponse('Recolecciones recuperadas con éxito', {
      recolects: recolectsWithLabel,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total
    });

  } catch (error) {
    return errorResponse('Error al obtener recolecciones del usuario: ' + error.message);
  }
}


async function getReciept(req) {
  try {
    const recolectId = req.params.id;
    const recolect = await RecolectModel.findById(recolectId).lean();

    if (!recolect) {
      return errorResponse('Recolección no encontrada');
    }

    return dataResponse('Recibo de recolección generado con éxito', {
      recolect
    });
  } catch (error) {
    return errorResponse('Error al obtener el recibo de recolección: ' + error.message);
  }
}


module.exports = {
  createRecolect,
  getAllRecolects,
  getRecolectsByUser,
  getReciept
};