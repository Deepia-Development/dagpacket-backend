const mongoose = require("mongoose");
const ShipmentsModel = require("../../models/ShipmentsModel");
const TransactionModel = require("../../models/TransactionsModel");
const InvestmentsModel = require("../../models/investments/LockerInvestments");
const LockerModel = require("../../models/LockerModel");
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../../helpers/ResponseHelper");

class SimulationService {

async getUserInvestmentTransactions(req) {
  const { locker_id, user_id } = req.params;
  const { year, month } = req.query;

  try {
    const userInvestment = await InvestmentsModel.findOne({ locker_id, user_id });

    if (!userInvestment) {
      throw new Error("El usuario no tiene una inversión activa en este locker");
    }

    const percentage = parseFloat(userInvestment.amount);

    const simulationUserIds = [
      new mongoose.Types.ObjectId("6758b88e2877ef43736d2817"),
      new mongoose.Types.ObjectId("678fe4df239e2a479e6c8691"),
    ];

    const matchStage = {
      user_id: { $in: simulationUserIds },
      status: "Pagado",
    };

    if (year && month) {
      matchStage.$expr = {
        $and: [
          { $eq: [{ $year: "$createdAt" }, Number(year)] },
          { $eq: [{ $month: "$createdAt" }, Number(month)] },
        ],
      };
    }

    const shipments = await TransactionModel.aggregate([
      { $match: matchStage },
      { $unwind: "$shipment_ids" },
      {
        $lookup: {
          from: "shipments",
          localField: "shipment_ids",
          foreignField: "_id",
          as: "shipment_info",
        },
      },
      { $unwind: "$shipment_info" },
      {
        $project: {
          user_id: 1,
          provider: "$shipment_info.provider",
          price: { $toDouble: "$shipment_info.price" },
          cost: { $toDouble: "$shipment_info.cost" },
          general_profit: {
            $round: [
              {
                $subtract: [
                  { $toDouble: "$shipment_info.price" },
                  { $toDouble: "$shipment_info.cost" },
                ],
              },
              2,
            ],
          },
          user_profit: {
            $round: [
              {
                $multiply: [
                  { $divide: [percentage, 100] },
                  {
                    $subtract: [
                      { $toDouble: "$shipment_info.price" },
                      { $toDouble: "$shipment_info.cost" },
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { "shipment_info.createdAt": -1 } },
    ]);

    if (!shipments.length) {
      return dataResponse("No se encontraron transacciones simuladas para este periodo", []);
    }

    // 🔹 Calcular ganancias totales por usuario (individual y general)
    const userTotals = {};
    let totalGeneralProfit = 0; // utilidad real global

    for (const tx of shipments) {
      const uid = tx.user_id.toString();
      if (!userTotals[uid]) userTotals[uid] = 0;
      userTotals[uid] += tx.user_profit;
      totalGeneralProfit += tx.general_profit;
    }

    // 🔹 Mostrar resultados en consola
    console.log("💰 Ganancias generadas por cada usuario simulado:");
    Object.entries(userTotals).forEach(([uid, total]) => {
      console.log(`🧾 Usuario ${uid}: $${total.toFixed(2)} (su parte)`);
    });

    const totalUserProfit = Object.values(userTotals).reduce((sum, val) => sum + val, 0);
    console.log(`💸 Total combinado de usuarios (solo su parte): $${totalUserProfit.toFixed(2)}`);

    console.log(`🏦 Utilidad general total (todas las transacciones): $${totalGeneralProfit.toFixed(2)}`);

    return dataResponse("Ganancias simuladas obtenidas exitosamente", shipments);
  } catch (error) {
    console.error("Error en getUserInvestmentTransactions (simulado):", error);
    return dataResponse(error.message, [], false);
  }
}



async getLockerServiceProfits(req) {
  const { locker_id, user_id } = req.params;
  const { year, month } = req.query;

  try {
    // 🔹 Buscar inversión del usuario
    const userInvestment = await InvestmentsModel.findOne({ locker_id, user_id });
    const userPercentage = userInvestment ? parseFloat(userInvestment.amount) : 30;

    // 🔹 IDs simulados
    const simulationUserIds = [
      new mongoose.Types.ObjectId("6758b88e2877ef43736d2817"),
      new mongoose.Types.ObjectId("678fe4df239e2a479e6c8691"),
    ];

    // 🔹 Filtro base
    const matchStage = {
      user_id: { $in: simulationUserIds },
      $or: [{ service: /Recarga/i }, { service: /Pago de servicio/i }],
      status: "Pagado",
    };

    // 🔹 Filtro de año y mes si se envían
    if (year && month) {
      matchStage.$expr = {
        $and: [
          { $eq: [{ $year: "$createdAt" }, Number(year)] },
          { $eq: [{ $month: "$createdAt" }, Number(month)] },
        ],
      };
    }

    // 🔹 Buscar las transacciones simuladas
    const transactions = await TransactionModel.aggregate([
      { $match: matchStage },
      {
        $project: {
          service: 1,
          amount: { $toDouble: "$amount" },
          emida_details: 1,
          details: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    if (!transactions.length) {
      return dataResponse("No hay transacciones simuladas para este periodo", []);
    }

    // 🔹 Calcular ganancias simuladas
    let totalRechargeProfit = 0;
    let totalServiceProfit = 0;
    let totalUserProfit = 0;

    const detailed = transactions.map((tx) => {
      const amount = tx.amount;
      let generalProfit = 0;

      // 💰 5% para recargas, $9 fijo para pagos de servicio
      if (/Recarga/i.test(tx.service)) generalProfit = amount * 0.05;
      else if (/Pago de servicio/i.test(tx.service)) generalProfit = 9;

      const userProfit = (generalProfit * userPercentage) / 100;

      if (/Recarga/i.test(tx.service)) totalRechargeProfit += userProfit;
      if (/Pago de servicio/i.test(tx.service)) totalServiceProfit += userProfit;
      totalUserProfit += userProfit;

      return {
        servicio: tx.service,
        producto: tx.emida_details || "Sin detalle",
        descripcion: tx.details || "Sin descripción",
        monto_transaccion: parseFloat(amount.toFixed(2)),
        ganancias_generales: parseFloat(generalProfit.toFixed(2)),
        ganancias_usuario: parseFloat(userProfit.toFixed(2)),
        fecha: tx.createdAt,
      };
    });

    // 🔹 Resumen general
    const summary = {
      locker_id,
      user_id,
      porcentaje_inversion: userPercentage,
      resumen: {
        recargas: parseFloat(totalRechargeProfit.toFixed(2)),
        pagos_servicio: parseFloat(totalServiceProfit.toFixed(2)),
        total_usuario: parseFloat(totalUserProfit.toFixed(2)),
      },
    };

    return dataResponse("Ganancias simuladas calculadas exitosamente", { summary, detailed });
  } catch (error) {
    console.error("Error calculando ganancias simuladas:", error);
    throw new Error("Error al calcular ganancias simuladas: " + error.message);
  }
}


}

module.exports = SimulationService;