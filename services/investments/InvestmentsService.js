const InvestmentsModel = require('../../models/investments/LockerInvestments');
const LockerModel = require('../../models/LockerModel');
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../../helpers/ResponseHelper");


async function investInLocker(req, res) {
  const { locker_id, user_id, amount } = req.body;

  try {
    // 🔹 Verificar locker existente
    const locker = await LockerModel.findById(locker_id);
    if (!locker) {
      return res.json(await errorResponse("Locker not found"));
    }

    // 🔹 Validar porcentaje
    const investmentPercent = parseFloat(amount);
    if (isNaN(investmentPercent) || investmentPercent <= 0) {
      return res.json(await errorResponse("Invalid investment percentage"));
    }

    if (investmentPercent > 100) {
      return res.json(await errorResponse("Percentage cannot exceed 100%"));
    }

    // 🔹 Calcular total actual invertido (en porcentaje)
    const totalInvestedAgg = await InvestmentsModel.aggregate([
      { $match: { locker_id: locker._id } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const totalInvested = totalInvestedAgg[0]?.total || 0;
    const remaining = 100 - totalInvested; // margen restante del 100%

    if (remaining <= 0) {
      return res.json(await errorResponse("This locker is already fully invested (100%)"));
    }

    if (investmentPercent > remaining) {
      return res.json(
        await errorResponse(
          `This investment exceeds the available margin. You can invest up to ${remaining.toFixed(2)}% only.`
        )
      );
    }

    // 🔹 Buscar inversión existente del usuario
    let existingInvestment = await InvestmentsModel.findOne({ locker_id, user_id });

    if (existingInvestment) {
      const currentPercent = parseFloat(existingInvestment.amount.toString());
      const newTotal = currentPercent + investmentPercent;

      if (newTotal > 100) {
        return res.json(await errorResponse("This investment would exceed 100% total participation for the locker."));
      }

      existingInvestment.amount = newTotal;
      await existingInvestment.save();
    } else {
      existingInvestment = await InvestmentsModel.create({
        locker_id,
        user_id,
        amount: investmentPercent,
      });
    }

    // 🔹 Recalcular totales globales
    const newTotalInvested = totalInvested + investmentPercent;
    const remainingPercent = 100 - newTotalInvested;

    return res.json(
      await dataResponse("Investment processed successfully", {
        investment: existingInvestment,
        total_invested_percent: newTotalInvested.toFixed(2) + "%",
        remaining_percent: remainingPercent.toFixed(2) + "%",
      })
    );

  } catch (error) {
    console.error("Investment Error:", error);
    return res.json(await errorResponse("Investment failed"));
  }


}



async function listInvestments(req, res) {
  try {
    console.log("Listing investments with USER + LOCKER populate");

    const investments = await InvestmentsModel.find({})
      .populate({
        path: "user_id",
        select: "name email role",
        options: { strictPopulate: false }
      })
      .populate({
        path: "locker_id",
        select: "id_locker ubication city state country",
        options: { strictPopulate: false }
      })
      .lean();

    // Conversión del Decimal128
    investments.forEach(inv => {
      if (inv.amount) {
        inv.amount = Number(inv.amount);
      }
    });

    return res.json(investments);
  } catch (error) {
    console.error("Populate error:", error);
    return res.status(500).json({ error: error.message });
  }
}


async function listInvestmentsByLocker(req, res) {
  try {
    const { lockerId } = req.params;
    console.log("Listing investments for locker:", lockerId);

    if (!lockerId) {
      return res.status(400).json({ error: "lockerId is required" });
    }

    const investments = await InvestmentsModel.find({ locker_id: lockerId })
      .populate({
        path: "user_id",
        select: "name email role",
        options: { strictPopulate: false }
      })
      .populate({
        path: "locker_id",
        select: "id_locker ubication city state country",
        options: { strictPopulate: false }
      })
      .lean();

    investments.forEach(inv => {
      if (inv.amount) {
        inv.amount = Number(inv.amount);
      }
    });

    return res.json({
      message: "Investments retrieved successfully",
      count: investments.length,
      data: investments
    });
  } catch (error) {
    console.error("Populate error:", error);
    return res.status(500).json({ error: error.message });
  }
}



async function listUserInvestments(req, res) {
  try {
    const { user_id } = req.params; // o req.query según tu ruta

    if (!user_id) {
      return res.json(await errorResponse("User ID is required"));
    }

    // 🔹 Buscar todas las inversiones de este usuario
    const investments = await InvestmentsModel.find({ user_id })
      .populate("locker_id", "_id name location") // datos del locker
      .populate("user_id", "_id name email"); // datos del usuario (opcional, si quieres mostrarlo)

    if (investments.length === 0) {
      return res.json(await dataResponse("No investments found for this user", []));
    }

    // 🔹 Agrupar lockers únicos donde tiene inversiones
    const lockers = investments.map(inv => inv.locker_id);
    const uniqueLockers = lockers.filter(
      (locker, index, self) => locker && index === self.findIndex(l => l._id.toString() === locker._id.toString())
    );

    // 🔹 Estructurar respuesta con lockers + sus porcentajes
    const responseData = {
      user: {
        _id: investments[0].user_id._id,
        name: investments[0].user_id.name,
        email: investments[0].user_id.email
      },
      total_investments: investments.length,
      lockers: uniqueLockers.map(locker => {
        const lockerInvestments = investments.filter(inv => inv.locker_id._id.toString() === locker._id.toString());
        const totalPercent = lockerInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);

        return {
          locker_id: locker._id,
          locker_name: locker.ubication,
          total_invested_percent: totalPercent.toFixed(2) + "%",
          investments: lockerInvestments.map(inv => ({
            investment_id: inv._id,
            amount: parseFloat(inv.amount.toString()).toFixed(2) + "%",
          }))
        };
      })
    };

    return res.json(await dataResponse("User investments retrieved successfully", responseData));

  } catch (error) {
    console.error("Error listing user investments:", error);
    return res.json(await errorResponse("Failed to retrieve user investments"));
  }
}



module.exports = {
  investInLocker,
  listInvestments,
    listUserInvestments,
    listInvestmentsByLocker
};
