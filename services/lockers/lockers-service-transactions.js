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

    async getLockerInvestments(req) {
    const { id } = req.params; // id del locker

    try {
      // 🔹 1. Obtener inversiones del locker
      const investments = await InvestmentsModel.find({ locker_id: id })
        .populate("user_id", "_id name email")
        .lean();

      const totalInvested = investments.reduce(
        (sum, inv) => sum + parseFloat(inv.amount.toString()),
        0
      );

      const dagpacketPercent = Math.max(0, 100 - totalInvested);

      // 🔹 2. Obtener las transacciones con envíos
      const transactions = await TransactionModel.aggregate([
        {
          $match: {
            locker_id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $unwind: "$shipment_ids",
        },
        {
          $lookup: {
            from: "shipments",
            localField: "shipment_ids",
            foreignField: "_id",
            as: "shipment_info",
          },
        },
        {
          $unwind: "$shipment_info",
        },
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
              dagpacket_profit: "$shipment_info.dagpacket_profit",
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      // 🔹 3. Calcular reparto de utilidades para cada transacción
      const transactionsWithSplit = transactions.map((t) => {
        const profit = parseFloat(t.shipment.dagpacket_profit?.toString() || 0);

        // Calcular cuánto le toca a cada inversionista
        const investorsShare = investments.map((inv) => {
          const percent = parseFloat(inv.amount.toString());
          const share = (profit * percent) / 100;
          return {
            investor_id: inv.user_id?._id,
            name: inv.user_id?.name || "Desconocido",
            email: inv.user_id?.email || "Sin correo",
            percent: percent.toFixed(2) + "%",
            profit_share: share.toFixed(2),
          };
        });

        // Calcular lo que queda para Dagpacket
        const dagpacketShare = (profit * dagpacketPercent) / 100;

        return {
          ...t,
          profit_distribution: {
            total_profit: profit.toFixed(2),
            dagpacket_percent: dagpacketPercent.toFixed(2) + "%",
            dagpacket_share: dagpacketShare.toFixed(2),
            investors: investorsShare,
          },
        };
      });

      return dataResponse("Transacciones con reparto obtenidas exitosamente", {
        locker_id: id,
        total_investors: investments.length,
        dagpacket_percent: dagpacketPercent.toFixed(2) + "%",
        transactions: transactionsWithSplit,
      });
    } catch (error) {
      console.error("Error fetching locker transactions:", error);
      return errorResponse("Error fetching locker transactions: " + error.message);
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

}

module.exports = new LockersServiceTransactions();
