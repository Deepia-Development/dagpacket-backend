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
class LockersServiceTransactions {
  async getLockerTransactions(req) {
    const { id } = req.params;
    try {
      const transactions = await TransactionModel.aggregate([
        // 🔹 Filtrar solo transacciones del locker indicado
        {
          $match: {
            locker_id: new mongoose.Types.ObjectId(id)
          }
        },
        // 🔹 Desenrollar los envíos
        {
          $unwind: "$shipment_ids"
        },
        // 🔹 Vincular los envíos relacionados
        {
          $lookup: {
            from: "shipments",
            localField: "shipment_ids",
            foreignField: "_id",
            as: "shipment_info"
          }
        },
        {
          $unwind: "$shipment_info"
        },
        // 🔹 Seleccionar solo los datos relevantes
        {
          $project: {
            _id: 1,
            locker_id: 1,
            service: 1,
            transaction_number: 1,
            payment_method: 1,
            amount: 1,
            status: 1,
            createdAt: 1,
            "shipment": {
              id: "$shipment_info._id",
              status: "$shipment_info.status",
              provider: "$shipment_info.provider",
              cost: "$shipment_info.cost",
              price: "$shipment_info.price",
              dagpacket_profit: "$shipment_info.dagpacket_profit"
            }
          }
        },
        // 🔹 Ordenar por fecha descendente
        {
          $sort: { createdAt: -1 }
        }
      ]);

      return dataResponse("Transacciones obtenidas exitosamente", transactions);
    } catch (error) {
      console.error("Error fetching locker transactions:", error);
      throw new Error("Error fetching locker transactions: " + error.message);
    }
  }

   async getUserInvestmentReturns(req) {
    const { locker_id, user_id } = req.params;

    try {
      // 1️⃣ Buscar inversión del usuario
      const userInvestment = await InvestmentsModel.findOne({ locker_id, user_id });

      if (!userInvestment) {
        return dataResponse("El usuario no tiene inversión registrada en este locker", []);
      }

      // 2️⃣ Calcular el porcentaje de inversión
      const percentage = parseFloat(userInvestment.amount);

      // 3️⃣ Agrupar transacciones por mes y año
      const monthlyProfits = await TransactionModel.aggregate([
        {
          $match: {
            locker_id: new mongoose.Types.ObjectId(locker_id),
          },
        },
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
          // Agrupamos por mes y año
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total_profit: { $sum: "$shipment_info.dagpacket_profit" },
          },
        },
        {
          // Ordenamos por año y mes
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

      // 4️⃣ Calcular la ganancia del usuario por mes
      const monthlyReturns = monthlyProfits.map((item) => {
        const totalProfit = parseFloat(item.total_profit);
        const userProfit = (percentage / 100) * totalProfit;

        return {
          year: item._id.year,
          month: item._id.month,
          user_profit: parseFloat(userProfit.toFixed(2)),
        };
      });

      // 5️⃣ Responder con los datos
      return dataResponse("Ganancia mensual calculada exitosamente", {
        locker_id,
        user_id,
        investment_percentage: percentage,
        monthly_returns: monthlyReturns,
      });
    } catch (error) {
      console.error("Error calculando ganancias del usuario:", error);
      throw new Error("Error al calcular ganancias del usuario: " + error.message);
    }
  }



  async getUserInvestmentReturns(req) {
    const { locker_id, user_id } = req.params;
    const { year, month } = req.query; // 👈 Parámetros opcionales

    try {
      // 1️⃣ Buscar inversión del usuario
      const userInvestment = await InvestmentsModel.findOne({ locker_id, user_id });

      if (!userInvestment) {
        return dataResponse("El usuario no tiene inversión registrada en este locker", []);
      }

      // 2️⃣ Calcular porcentaje de inversión
      const percentage = parseFloat(userInvestment.amount);

      // 3️⃣ Construir filtro dinámico
      const matchStage = {
        locker_id: new mongoose.Types.ObjectId(locker_id),
      };

      // Si se mandan año y mes, filtra solo ese mes
      if (year && month) {
        matchStage.$expr = {
          $and: [
            { $eq: [{ $year: "$createdAt" }, Number(year)] },
            { $eq: [{ $month: "$createdAt" }, Number(month)] },
          ],
        };
      }

      // 4️⃣ Obtener y agrupar profits por mes
      const monthlyProfits = await TransactionModel.aggregate([
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
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total_profit: { $sum: "$shipment_info.dagpacket_profit" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      if (monthlyProfits.length === 0) {
        return dataResponse("No hay transacciones para este periodo", []);
      }

      // 5️⃣ Calcular la ganancia del usuario por mes
      const monthlyReturns = monthlyProfits.map((item) => {
        const totalProfit = parseFloat(item.total_profit);
        const userProfit = (percentage / 100) * totalProfit;

        return {
          year: item._id.year,
          month: item._id.month,
          user_profit: parseFloat(userProfit.toFixed(2)),
        };
      });

      // 6️⃣ Armar respuesta
      return dataResponse("Ganancia mensual calculada exitosamente", {
        locker_id,
        user_id,
        investment_percentage: percentage,
        monthly_returns: monthlyReturns,
      });
    } catch (error) {
      console.error("Error calculando ganancias del usuario:", error);
      throw new Error("Error al calcular ganancias del usuario: " + error.message);
    }
  }

async getUserInvestmentTransactions(req) {
    const { locker_id, user_id } = req.params;
    const { year, month } = req.query;

    try {
      // 1️⃣ Buscar inversión del usuario
      const userInvestment = await InvestmentsModel.findOne({ locker_id, user_id });
      if (!userInvestment) {
        return dataResponse("El usuario no tiene inversión registrada en este locker", []);
      }

      const percentage = parseFloat(userInvestment.amount);

      // 2️⃣ Filtro dinámico (locker y opcionalmente mes/año)
      const matchStage = {
        locker_id: new mongoose.Types.ObjectId(locker_id),
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

      // 3️⃣ Buscar solo los datos esenciales
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
            _id: 0,
            provider: "$shipment_info.provider",
            price: "$shipment_info.price",
            dagpacket_profit: "$shipment_info.dagpacket_profit",
            user_profit: {
              $round: [
                {
                  $multiply: [
                    { $divide: [percentage, 100] },
                    "$shipment_info.dagpacket_profit",
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
        return dataResponse("No se encontraron envíos para este periodo", []);
      }

      return dataResponse("Ganancias por envío obtenidas exitosamente", shipments);
    } catch (error) {
      console.error("Error obteniendo envíos del usuario:", error);
      throw new Error("Error al obtener envíos del usuario: " + error.message);
    }
  }


 async payLockerTransaction(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    const { lockerId, paymentMethod, transactionNumber, amount, concept,type } = req.body;

    // 🔹 Verificar locker
    const locker = await LockerModel.findById(lockerId).session(session);
    if (!locker) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Locker not found");
    }

    // 🔹 Validar monto
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Invalid transaction amount");
    }

    // 🔹 Crear transacción del locker
    const transaction = new TransactionModel({
      locker_id: lockerId,
      service: type || "LOCKER_PAYMENT",
      transaction_number: transactionNumber || `LOCKER-${Date.now()}`,
      payment_method: paymentMethod || "N/A",
      amount: totalAmount.toFixed(2),
      details: concept || "Operación en locker",
      status: "Pagado",
      type: "LOCKER",
    });

    await transaction.save({ session });

    // 🔹 (Opcional) Enviar correo al responsable del locker
    // if (locker.email) {
    //   await sendEmail(
    //     locker.email,
    //     "Pago de Locker confirmado",
    //     `
    //       <p>Estimado/a,</p>
    //       <p>El pago del locker <strong>${locker.name}</strong> ha sido procesado correctamente.</p>
    //       <p>Detalles de la transacción:</p>
    //       <ul>
    //         <li><strong>Número de transacción:</strong> ${transaction.transaction_number}</li>
    //         <li><strong>Método de pago:</strong> ${paymentMethod}</li>
    //         <li><strong>Monto:</strong> $${totalAmount.toFixed(2)}</li>
    //       </ul>
    //       <p>Gracias por usar los servicios de DAGPACKET.</p>
    //     `
    //   );
    // }

    await session.commitTransaction();
    committed = true;
    session.endSession();

    return successResponse("Transacción de locker registrada exitosamente");
  } catch (error) {
    if (!committed) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.warn("AbortTransaction skipped:", abortError.message);
      }
    }

    session.endSession();
    console.error("Error en payLockerTransaction:", error);
    return errorResponse("Error processing locker transaction: " + error.message);
  }
}


async getLockerNonShipmentTransactions(req) {
  const { id } = req.params;
  try {
    const transactions = await TransactionModel.aggregate([
      // 🔹 Filtrar por locker y excluir las transacciones que tienen envíos
      {
        $match: {
          locker_id: new mongoose.Types.ObjectId(id),
          $or: [
            { service: "Recarga" },
            { service: "Pago de Servicio" },
            { service: { $exists: false } },
          ],
        },
      },
      // 🔹 Seleccionar solo los campos relevantes
      {
        $project: {
          _id: 1,
          locker_id: 1,
          service: 1,
          transaction_number: 1,
          payment_method: 1,
          amount: 1,
          details: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      // 🔹 Ordenar por fecha descendente
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return dataResponse(
      "Transacciones de recargas o servicios obtenidas exitosamente",
      transactions
    );
  } catch (error) {
    console.error("Error fetching locker non-shipment transactions:", error);
    return errorResponse(
      "Error al obtener las transacciones de recargas o servicios"
    );
  }
}

async getLockerServiceProfits(req) {
  const { locker_id, user_id } = req.params;
  const { year, month } = req.query; // filtros opcionales

  try {
    // 1️⃣ Buscar la inversión del usuario
    const userInvestment = await InvestmentsModel.findOne({ locker_id, user_id });
    if (!userInvestment) {
      return dataResponse("El usuario no tiene inversión registrada en este locker", []);
    }

    const userPercentage = parseFloat(userInvestment.amount); // Ejemplo: 30 = 30%

    // 2️⃣ Filtro base
    const matchStage = {
      locker_id: new mongoose.Types.ObjectId(locker_id),
      $or: [{ service: "Recarga" }, { service: "Pago de Servicio" }],
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

    // 3️⃣ Traer transacciones relevantes
    const transactions = await TransactionModel.aggregate([
      { $match: matchStage },
      {
        $project: {
          service: 1,
          amount: { $toDouble: "$amount" },
          details: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    if (!transactions.length) {
      return dataResponse("No hay transacciones registradas para este periodo", []);
    }

    // 4️⃣ Calcular ganancias
    let totalRechargeProfit = 0;
    let totalServiceProfit = 0;
    let totalUserProfit = 0;

    const detailed = transactions.map((tx) => {
      const amount = tx.amount;
      let generalProfit = 0;

      // 🟢 Regla 1: Recarga → 5% del monto
      if (tx.service === "Recarga") generalProfit = amount * 0.05;
      // 🟢 Regla 2: Pago de Servicio → $9 fijo
      else if (tx.service === "Pago de Servicio") generalProfit = 9;

      // 🧮 Lo que le toca al usuario
      const userProfit = (generalProfit * userPercentage) / 100;

      // Acumular
      if (tx.service === "Recarga") totalRechargeProfit += userProfit;
      if (tx.service === "Pago de Servicio") totalServiceProfit += userProfit;
      totalUserProfit += userProfit;

      return {
        servicio: tx.service,
        descripcion: tx.details || "Sin descripción",
        monto_transaccion: parseFloat(amount.toFixed(2)),
        ganancias_generales: parseFloat(generalProfit.toFixed(2)),
        ganancias_usuario: parseFloat(userProfit.toFixed(2)),
      };
    });

    // 5️⃣ Resumen general
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

    // ✅ Respuesta final
    return dataResponse("Ganancias calculadas exitosamente", { summary, detailed });
  } catch (error) {
    console.error("Error calculando ganancias:", error);
    throw new Error("Error al calcular ganancias: " + error.message);
  }
}

async getLockerGeneralTransactions(req) {
  const { id } = req.params;
  const { year, month } = req.query; // 👈 filtros opcionales

  try {
    // 🎯 Filtro base para ambas colecciones
    const baseMatch = {
      locker_id: new mongoose.Types.ObjectId(id),
      status: "Pagado",
    };

    // Si se pasa año/mes, se agrega condición temporal
    if (year && month) {
      baseMatch.$expr = {
        $and: [
          { $eq: [{ $year: "$createdAt" }, Number(year)] },
          { $eq: [{ $month: "$createdAt" }, Number(month)] },
        ],
      };
    }

    // 🧩 1️⃣ Transacciones con ENVÍOS
    const shipmentsPipeline = [
      { $match: { ...baseMatch, shipment_ids: { $exists: true, $ne: [] } } },
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
          _id: 0,
          type: { $literal: "Envío" },
          service: "$service",
          provider: "$shipment_info.provider",
          cost: { $toDouble: "$shipment_info.cost" },
          price: { $toDouble: "$shipment_info.price" },
          dagpacket_profit: { $toDouble: "$shipment_info.dagpacket_profit" },
          createdAt: 1,
        },
      },
    ];

    // 🧩 2️⃣ Transacciones SIN ENVÍOS (Recargas, Servicios)
    const nonShipmentPipeline = [
      {
        $match: {
          ...baseMatch,
          $or: [
            { service: "Recarga" },
            { service: "Pago de Servicio" },
            { service: { $exists: false } },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          type: { $literal: "Servicio" },
          service: 1,
          provider: { $literal: "DAGPACKET" },
          cost: {
            $switch: {
              branches: [
                { case: { $eq: ["$service", "Recarga"] }, then: { $multiply: [{ $toDouble: "$amount" }, 0.95] } },
                { case: { $eq: ["$service", "Pago de Servicio"] }, then: { $subtract: [{ $toDouble: "$amount" }, 9] } },
              ],
              default: { $toDouble: "$amount" },
            },
          },
          price: { $toDouble: "$amount" },
          dagpacket_profit: {
            $switch: {
              branches: [
                { case: { $eq: ["$service", "Recarga"] }, then: { $multiply: [{ $toDouble: "$amount" }, 0.05] } },
                { case: { $eq: ["$service", "Pago de Servicio"] }, then: 9 },
              ],
              default: 0,
            },
          },
          createdAt: 1,
        },
      },
    ];

    // 🧩 3️⃣ Combinar ambos tipos de transacciones
    const combined = await TransactionModel.aggregate([
      ...shipmentsPipeline,
      { $unionWith: { coll: "transactions", pipeline: nonShipmentPipeline } },
      { $sort: { createdAt: -1 } },
    ]);

    if (!combined.length) {
      return dataResponse("No se encontraron transacciones en este periodo", []);
    }

    // ✅ Resultado final
    return dataResponse("Transacciones generales del locker obtenidas exitosamente", combined);
  } catch (error) {
    console.error("Error fetching general transactions:", error);
    throw new Error("Error obteniendo transacciones generales: " + error.message);
  }
}

}

module.exports = new LockersServiceTransactions();
