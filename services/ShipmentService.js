const ShipmentsModel = require("../models/ShipmentsModel");
const UserPackingInventoryModel = require("../models/UserPackingModel");
const PackingModel = require("../models/PackingModel");
const UserModel = require("../models/UsersModel");
const CustomerModel = require("../models/CustomerModel");
const EmployeesModel = require("../models/EmployeesModel");
const WalletModel = require("../models/WalletsModel");
const CashRegisterModel = require("../models/CashRegisterModel");
const CashTransactionModel = require("../models/CashTransactionModel");
const TransactionModel = require("../models/TransactionsModel");
const TransactionHistoryModel = require("../models/HistoryTransaction");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const mongoose = require("mongoose");
const { search } = require("../routes/lockerRoutes");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Utiliza TLS
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
});

async function sendEmail(to, subject, content, attachments) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #D6542B;
            color: #ffffff;
            text-align: center;
            padding: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: center;
          }
          .content h2 {
            margin-top: 0;
            color: #D6542B;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #D6542B;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #C14623;
          }
          .footer {
            background-color: #f8f8f8;
            text-align: center;
            padding: 15px;
            font-size: 0.8em;
            color: #666666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DAGPACKET</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DAGPACKET. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    });
    console.log(`Correo enviado a ${to}`);
  } catch (error) {
    console.error(`Error al enviar correo a ${to}:`, error);
  }
}

async function createShipmentCustomer(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      shipment_type,
      from,
      to,
      payment,
      packing: requestPacking,
      shipment_data,
      insurance,
      cost,
      price,
      extra_price,
      discount,
      dagpacket_profit,
      description,
      provider,
      apiProvider,
      idService,
    } = req.body;

    const userId = req.params.userId;

    const user = await CustomerModel.findById(userId).session(session);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.stock < 1) {
      throw new Error("Stock insuficiente para crear el envío");
    }

    let packing = {
      answer: "No",
      packing_id: null,
      packing_type: "None",
      packing_cost: 0,
    };

    if (
      requestPacking &&
      requestPacking.answer === "Si" &&
      requestPacking.packing_id
    ) {
      const userInventory = await UserPackingInventoryModel.findOne({
        user_id: userId,
      }).session(session);

      if (!userInventory) {
        throw new Error("No se encontró inventario para este usuario");
      }

      const packingInventory = userInventory.inventory.find(
        (item) =>
          item.packing_id.toString() === requestPacking.packing_id.toString()
      );

      if (!packingInventory || packingInventory.quantity <= 0) {
        throw new Error("No hay suficiente inventario de este empaque");
      }

      const packingInfo = await PackingModel.findById(
        requestPacking.packing_id
      ).session(session);
      if (!packingInfo) {
        throw new Error("Empaque no encontrado");
      }

      await UserPackingInventoryModel.findOneAndUpdate(
        { user_id: userId, "inventory.packing_id": requestPacking.packing_id },
        { $inc: { "inventory.$.quantity": -1 } },
        { session }
      );

      packing = {
        answer: "Si",
        packing_id: requestPacking.packing_id,
        packing_type: packingInfo.type,
        packing_cost: packingInfo.sell_price,
      };
    }

    const newShipment = new ShipmentsModel({
      user_id: userId,
      shipment_type,
      from,
      to,
      payment: {
        ...payment,
        status: "Pendiente",
      },
      packing,
      shipment_data,
      insurance,
      cost,
      price,
      extra_price,
      discount,
      dagpacket_profit,
      description,
      provider,
      apiProvider,
      idService,
    });

    await newShipment.save({ session });

    user.stock -= 1;
    await user.save({ session });

    await session.commitTransaction();
    const shipmentId = newShipment._id.toString();
    console.log("Envío creado:", shipmentId);
    const qrImage = await QRCode.toDataURL(shipmentId);
    const qrImageBuffer = Buffer.from(qrImage.split(",")[1], "base64");

    const attachments = [
      {
        filename: `codigo-qr-${shipmentId}.png`, // Nombre del archivo
        content: qrImageBuffer, // Buffer de la imagen
        contentType: "image/png", // Tipo MIME
      },
    ];

    await sendEmail(
      from.email,
      "Pedido creado exitosamente",
      `
          <p>Estimado/a ${from.name},</p>
          <p>Su pedido ha sido creado exitosamente.</p>
          <p>El número de folio es: <strong>${shipmentId}</strong></p>
 <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>
    <p>Gracias por usar nuestros servicios.</p>

          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
        `,
      attachments // Pasamos las imágenes como adjunto
    );

    // Enviar correo con el adjunto
    await sendEmail(
      to.email,
      "Nuevo envío en camino",
      `
    <p>Estimado/a ${to.name},</p>
    <p>Se ha generado un nuevo envío para usted.</p>
    <p>El número de seguimiento es: <strong>${shipmentId}</strong></p>
    <p>Pronto recibirá más información sobre el estado de su envío.</p>
    <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>
    <p>Gracias por usar nuestros servicios.</p>
    
    <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
    <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
  `,
      attachments // Adjuntar el código QR
    );

    return {
      success: true,
      message: "Envío creado exitosamente",
      shipment: newShipment._id.toJSON(),
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error al crear el envío:", error);
    return errorResponse(error.message);
  } finally {
    session.endSession();
  }
}
async function createShipment(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      shipment_type,
      from,
      to,
      payment,
      packing: requestPacking,
      shipment_data,
      insurance,
      cost,
      price,
      extra_price,
      discount,
      dagpacket_profit,
      description,
      provider,
      apiProvider,
      idService,
    } = req.body;

    const userId = req.params.userId;

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.stock < 1) {
      throw new Error("Stock insuficiente para crear el envío");
    }

    let packing = {
      answer: "No",
      packing_id: null,
      packing_type: "None",
      packing_cost: 0,
    };

    if (
      requestPacking &&
      requestPacking.answer === "Si" &&
      requestPacking.packing_id
    ) {
      const userInventory = await UserPackingInventoryModel.findOne({
        user_id: userId,
      }).session(session);

      if (!userInventory) {
        throw new Error("No se encontró inventario para este usuario");
      }

      const packingInventory = userInventory.inventory.find(
        (item) =>
          item.packing_id.toString() === requestPacking.packing_id.toString()
      );

      if (!packingInventory || packingInventory.quantity <= 0) {
        throw new Error("No hay suficiente inventario de este empaque");
      }

      const packingInfo = await PackingModel.findById(
        requestPacking.packing_id
      ).session(session);
      if (!packingInfo) {
        throw new Error("Empaque no encontrado");
      }

      await UserPackingInventoryModel.findOneAndUpdate(
        { user_id: userId, "inventory.packing_id": requestPacking.packing_id },
        { $inc: { "inventory.$.quantity": -1 } },
        { session }
      );

      packing = {
        answer: "Si",
        packing_id: requestPacking.packing_id,
        packing_type: packingInfo.type,
        packing_cost: packingInfo.sell_price,
      };
    }

    const newShipment = new ShipmentsModel({
      user_id: userId,
      shipment_type,
      from,
      to,
      payment: {
        ...payment,
        status: "Pendiente",
      },
      packing,
      shipment_data,
      insurance,
      cost,
      price,
      extra_price,
      discount,
      dagpacket_profit,
      description,
      provider,
      apiProvider,
      idService,
    });

    await newShipment.save({ session });

    user.stock -= 1;
    await user.save({ session });

    await session.commitTransaction();
    const shipmentId = newShipment._id.toString();
    console.log("Envío creado:", shipmentId);
    const qrImage = await QRCode.toDataURL(shipmentId);
    const qrImageBuffer = Buffer.from(qrImage.split(",")[1], "base64");

    const attachments = [
      {
        filename: `codigo-qr-${shipmentId}.png`, // Nombre del archivo
        content: qrImageBuffer, // Buffer de la imagen
        contentType: "image/png", // Tipo MIME
      },
    ];

    await sendEmail(
      from.email,
      "Pedido creado exitosamente",
      `
          <p>Estimado/a ${from.name},</p>
          <p>Su pedido ha sido creado exitosamente.</p>
          <p>El número de folio es: <strong>${shipmentId}</strong></p>
 <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>
    <p>Gracias por usar nuestros servicios.</p>

          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
        `,
      attachments // Pasamos las imágenes como adjunto
    );

    // Enviar correo con el adjunto
    await sendEmail(
      to.email,
      "Nuevo envío en camino",
      `
    <p>Estimado/a ${to.name},</p>
    <p>Se ha generado un nuevo envío para usted.</p>
    <p>El número de seguimiento es: <strong>${shipmentId}</strong></p>
    <p>Pronto recibirá más información sobre el estado de su envío.</p>
    <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>
    <p>Gracias por usar nuestros servicios.</p>
    
    <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
    <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
  `,
      attachments // Adjuntar el código QR
    );

    return {
      success: true,
      message: "Envío creado exitosamente",
      shipment: newShipment._id.toJSON(),
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error al crear el envío:", error);
    return errorResponse(error.message);
  } finally {
    session.endSession();
  }
}

async function updateShipment(req) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        shipment_type,
        from,
        to,
        payment,
        packing: requestPacking,
        shipment_data,
        insurance,
        cost,
        price,
        extra_price,
        discount,
        dagpacket_profit,
        description,
        provider,
        apiProvider,
        idService,
      } = req.body;

      const shipmentId = req.params.id;

      // Buscar el pedido
      const shipment = await ShipmentsModel.findById(shipmentId).session(
        session
      );
      if (!shipment) {
        throw new Error("Pedido no encontrado");
      }

      let packing = {
        answer: "No",
        packing_id: null,
        packing_type: "None",
        packing_cost: 0,
      };

      if (
        requestPacking &&
        requestPacking.answer === "Si" &&
        requestPacking.packing_id
      ) {
        const userInventory = await UserPackingInventoryModel.findOne({
          user_id: shipment.user_id,
        }).session(session);

        if (!userInventory) {
          throw new Error("No se encontró inventario para este usuario");
        }

        const packingInventory = userInventory.inventory.find(
          (item) =>
            item.packing_id.toString() === requestPacking.packing_id.toString()
        );

        if (!packingInventory || packingInventory.quantity <= 0) {
          throw new Error("No hay suficiente inventario de este empaque");
        }

        const packingInfo = await PackingModel.findById(
          requestPacking.packing_id
        ).session(session);
        if (!packingInfo) {
          throw new Error("Empaque no encontrado");
        }

        await UserPackingInventoryModel.findOneAndUpdate(
          {
            user_id: shipment.user_id,
            "inventory.packing_id": requestPacking.packing_id,
          },
          { $inc: { "inventory.$.quantity": -1 } },
          { session }
        );

        packing = {
          answer: "Si",
          packing_id: requestPacking.packing_id,
          packing_type: packingInfo.type,
          packing_cost: packingInfo.sell_price,
        };
      }

      // Actualiza el pedido usando findOneAndUpdate
      const updatedShipment = await ShipmentsModel.findOneAndUpdate(
        { _id: shipmentId },
        {
          $set: {
            shipment_type,
            from,
            to,
            payment: {
              ...shipment.payment,
              ...payment,
              status: payment?.status || shipment.payment.status,
            },
            packing,
            shipment_data,
            insurance,
            cost,
            price,
            extra_price,
            discount,
            dagpacket_profit,
            description,
            provider,
            apiProvider,
            idService,
          },
        },
        { new: true, session }
      );

      await session.commitTransaction();
      return {
        success: true,
        message: "Pedido actualizado exitosamente",
        shipment: updatedShipment._id.toJSON(),
      };
    } catch (error) {
      await session.abortTransaction();

      // Si es un error transitorio, reintenta
      if (
        error.errorLabels &&
        error.errorLabels.includes("TransientTransactionError")
      ) {
        retries += 1;
        console.warn(`Reintentando la transacción... intento ${retries}`);
        continue; // Reintenta la transacción
      }

      console.error("Error al actualizar el pedido:", error);
      return errorResponse(error.message);
    } finally {
      session.endSession();
    }
  }

  return {
    success: false,
    message: "Falló la actualización del pedido tras varios intentos.",
  };
}
async function shipmentProfit(req) {
  try {
    const { id } = req.params;

    // Obtener la fecha actual
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Calcular el primer día del mes pasado
    const firstDayLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    // Calcular el último día del mes pasado
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const result = await ShipmentsModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: firstDayLastMonth }, // Considerar solo envíos desde el inicio del mes pasado
        },
      },
      {
        $project: {
          extra_price: { $toDecimal: "$extra_price" },
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          profit: { $sum: "$extra_price" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          profit: { $round: ["$profit", 2] },
        },
      },
    ]);

    if (result.length === 0) {
      return errorResponse(
        "No se encontraron envíos para el usuario especificado en los últimos dos meses"
      );
    }
    // Inicializar las ganancias
    let lastMonthProfit = 0;
    let currentMonthProfit = 0;
    // Asignar las ganancias al mes correspondiente
    result.forEach((item) => {
      if (item.month === lastDayLastMonth.getMonth() + 1) {
        lastMonthProfit = item.profit;
      } else if (item.month === now.getMonth() + 1) {
        currentMonthProfit = item.profit;
      }
    });

    return dataResponse("Ganancias calculadas exitosamente", {
      lastMonthProfit,
      currentMonthProfit,
    });
  } catch (error) {
    console.log("No se pudo calcular la ganancia: " + error);
    return errorResponse("No se pudo calcular la ganancia");
  }
}

async function getProfitPacking(req) {
  try {
    const { id } = req.params;
    const result = await ShipmentsModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(id),
          "packing.answer": "Si", // Solo consideramos envíos con empaque
        },
      },
      {
        $group: {
          _id: null,
          totalPackingCost: {
            $sum: { $toDecimal: "$packing.packing_cost" },
          },
          totalPackings: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalPackingCost: { $round: ["$totalPackingCost", 2] },
          totalPackings: 1,
        },
      },
    ]);

    if (result.length === 0) {
      return successResponse({
        totalPackingCost: 0,
        totalPackings: 0,
      });
    }

    const packingInfo = result[0];
    return successResponse(packingInfo);
  } catch (error) {
    console.log("No se pudo calcular el costo total de empaque: " + error);
    return errorResponse("No se pudo calcular el costo total de empaque");
  }
}

async function getUserShipments(req) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const shipments = await ShipmentsModel.paginate({ user_id: id }, options);

    if (shipments.docs.length === 0) {
      return errorResponse("No se encontraron envíos");
    }

    return dataResponse("Envíos", {
      shipments: shipments.docs,
      totalPages: shipments.totalPages,
      currentPage: shipments.page,
      totalShipments: shipments.totalDocs,
    });
  } catch (error) {
    console.log("No se pudieron obtener los envíos: " + error);
    return errorResponse("Error al obtener los envíos");
  }
}

async function globalProfit() {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    const result = await ShipmentsModel.aggregate([
      {
        $match: {
          distribution_at: {
            $gte: new Date(currentYear, currentMonth, 1), // Inicio del mes actual
            $lt: new Date(currentYear, currentMonth + 1, 1), // Inicio del próximo mes
          },
        },
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: { $toDouble: "$utilitie_dag" } },
        },
      },
      {
        $project: {
          _id: 0,
          month: currentMonth + 1, // Ajustamos para que sea 1-12 en lugar de 0-11
          totalProfit: { $round: ["$totalProfit", 2] },
        },
      },
    ]);

    // Si no hay resultados, devolvemos un objeto con utilidad 0
    const monthlyProfit = result[0] || {
      month: currentMonth + 1,
      totalProfit: 0,
    };

    return successResponse({ monthlyProfit });
  } catch (error) {
    console.log(
      "No se pudo calcular la ganancia global para el mes actual: " + error
    );
    return errorResponse(
      "No se pudo calcular la ganancia global para el mes actual"
    );
  }
}

async function getAllShipments(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
    };

    const shipments = await ShipmentsModel.paginate({}, options);

    if (shipments.docs.length === 0) {
      return errorResponse("No se encontraron envíos");
    }

    return dataResponse("Todos los envíos", {
      shipments: shipments.docs,
      totalPages: shipments.totalPages,
      currentPage: shipments.page,
      totalShipments: shipments.totalDocs,
    });
  } catch (error) {
    console.log("No se pudieron obtener los envíos: " + error);
    return errorResponse("Error al obtener los envíos");
  }
}

async function getShipmentPaid(req) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      searchBy = 'name',
    } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      search: searchBy

    };

    const shipments = await ShipmentsModel.paginate(
      { "payment.status": "Pagado" },
      options
    );

    if (shipments.docs.length === 0) {
      return errorResponse("No se encontraron envíos pagados");
    }

    return dataResponse("Envíos pagados", {
      shipments: shipments.docs,
      totalPages: shipments.totalPages,
      currentPage: shipments.page,
      totalShipments: shipments.totalDocs,
    });
  } catch (error) {
    console.log("No se pudieron obtener los envíos pagados: " + error);
    return errorResponse("Error al obtener los envíos pagados");
  }
}

async function payShipments(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ids, paymentMethod, transactionNumber } = req.body;
    const userId = req.user.user._id;

    // TransactionHistoryService.create(`userId: ${userId}, ids: ${ids}, paymentMethod: ${paymentMethod}, transactionNumber: ${transactionNumber}`);

    let user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Determinar el usuario cuyo wallet y porcentaje de utilidad se usará
    let actualUserId = userId;
    let utilityPercentage;
    if (user.role === "CAJERO" && user.parentUser) {
      actualUserId = user.parentUser;
      user = await UserModel.findById(actualUserId).session(session);
      if (!user) {
        throw new Error("Usuario padre no encontrado");
      }
    }
    utilityPercentage = user.dagpacketPercentaje
      ? parseFloat(user.dagpacketPercentaje.toString()) / 100
      : 0;

    // Buscar el wallet del usuario
    const wallet = await WalletModel.findOne({ user: actualUserId }).session(
      session
    );
    if (!wallet) {
      throw new Error("Wallet no encontrado para el usuario");
    }

    const shipments = await ShipmentsModel.find({ _id: { $in: ids } }).session(
      session
    );
    if (shipments.length === 0) {
      throw new Error("No se encontraron envíos pendientes de pago");
    }

    let totalPrice = 0;

    for (const shipment of shipments) {
      if (shipment.payment.status !== "Pagado") {
        totalPrice += parseFloat(shipment.price.toString());

        // Calcular utilidades
        const dagpacketProfit = parseFloat(
          shipment.dagpacket_profit.toString()
        );

        const discount = parseFloat(shipment.discount.toString());

        let totalUtilitie = dagpacketProfit + discount;



        const utilityLic = (totalUtilitie * 0.7) - discount;
        const utilityDag = dagpacketProfit - utilityLic;

        // Actualizar el envío con las utilidades calculadas
        shipment.utilitie_lic = utilityLic.toFixed(2);
        shipment.utilitie_dag = utilityDag.toFixed(2);
        shipment.payment.status = "Pagado";
        shipment.payment.method = paymentMethod;
        shipment.payment.transaction_number =
          transactionNumber || `${Date.now()}`;

        await shipment.save({ session });
      }
    }

    // Verificar saldo del wallet si el método de pago es 'saldo'
    if (paymentMethod === "saldo") {
      const sendBalance = parseFloat(wallet.sendBalance.toString());
      if (sendBalance < totalPrice) {
        throw new Error("Saldo insuficiente en la cuenta para envíos");
      }
      wallet.sendBalance = sendBalance - totalPrice;
      await wallet.save({ session });
    }

    const previous_balance =
      parseFloat(wallet.sendBalance.toString()) + totalPrice;

    // Registrar la transacción general
    const transaction = new TransactionModel({
      user_id: actualUserId,
      licensee_id:
        user.role === "LICENCIATARIO_TRADICIONAL" ? user._id : user.licensee_id,
      shipment_ids: ids,
      transaction_number: transactionNumber || `${Date.now()}`,
      payment_method: paymentMethod,
      previous_balance: previous_balance.toFixed(2),
      amount: totalPrice .toFixed(2),
      new_balance: (previous_balance - totalPrice).toFixed(2),
      details: `Pago de ${shipments.length} envío(s)`,
      status: "Pagado",
    });

    await transaction.save({ session });

    // Manejar el registro de caja
    let currentCashRegister = await CashRegisterModel.findOne({
      licensee_id: user.role === "CAJERO" ? user.parentUser : actualUserId,
      status: "open",
    }).session(session);

    if (currentCashRegister) {
      // Registrar la transacción en la caja
      const cashTransaction = new CashTransactionModel({
        cash_register_id: currentCashRegister._id,
        transaction_id: transaction._id,
        licensee_id: user.role === "CAJERO" ? user.parentUser : actualUserId,
        employee_id: user.role === "CAJERO" ? userId : undefined,
        payment_method: paymentMethod,
        amount: totalPrice,
        type: "ingreso",
        details: `Pago de ${shipments.length} envío(s)`,
      });
      await cashTransaction.save({ session });

      // Actualizar el total de ventas de la caja
      currentCashRegister.total_sales += totalPrice;
      await currentCashRegister.save({ session });
    }

    await session.commitTransaction();
    return {
      success: true,
      message: "Envíos pagados exitosamente",
      shipments: ids,
      totalPrice,
    };
  } catch (error) {
    await session.abortTransaction();
    return { success: false, message: error.message };
  } finally {
    session.endSession();
  }
}

async function userPendingShipments(req) {
  try {
    const { id } = req.params;
    const pendingShipments = await ShipmentsModel.find({
      user_id: id,
      "payment.status": "Pendiente",
    });

    if (pendingShipments.length > 0) {
      return dataResponse("Envíos pendientes:", pendingShipments);
    } else {
      return dataResponse("No hay envíos pendientes", []);
    }
  } catch (error) {
    console.log("Error al obtener los envíos pendientes: " + error);
    return errorResponse("Error al obtener los envíos pendientes");
  }
}

async function userShipments(req) {
  try {
    const { user_id } = req.params;
    const Shipment = await ShipmentsModel.find({ user_id: user_id });

    if (Shipment) {
      return dataResponse("Hisotorial de envios", Shipment);
    }
  } catch (error) {
    return errorResponse("Algo ocurrio", error.message);
  }
}

async function detailShipment(req) {
  try {
    const { id } = req.params;
    const Shipment = await ShipmentsModel.findOne({ _id: id });
    if (Shipment) {
      return dataResponse("Detalles del envio", Shipment);
    } else {
      return errorResponse("No se econtro el pedido");
    }
  } catch (error) {
    return errorResponse("Ocurrio un error: " + error);
  }
}

async function saveGuide(req) {
  try {
    const { id } = req.params;
    const Shipment = await ShipmentsModel.findOneAndUpdate(
      { _id: id },
      { guide: req.body.guide, guide_number: req.body.guide_number },
      { new: true }
    );
    if (Shipment) {
      return successResponse("Guia guardada");
    } else {
      throw new Error("No se encontró el envío");
    }
  } catch (error) {
    console.error("Error al guardar la guía:", error);
    throw error;
  }
}

async function deleteShipment(req) {
  try {
    const { id } = req.params;
    const shipment = await ShipmentsModel.findById(id);
    if (!shipment) {
      return errorResponse("El envío no existe");
    }

    const deletedShipment = await ShipmentsModel.findByIdAndDelete(id);

    if (deletedShipment) {
      return successResponse("Envío eliminado exitosamente", {
        deletedShipmentId: id,
      });
    } else {
      return errorResponse(
        "No se pudo eliminar el envío por razones desconocidas"
      );
    }
  } catch (error) {
    console.error("Error al intentar eliminar el envío:", error);
    return errorResponse(
      "Error interno del servidor al intentar eliminar el envío",
      error
    );
  }
}

async function getQuincenalProfit(req) {
  try {
    const { userId, year, month, quincena } = req.query;

      console.log("userId", userId);
      console.log("year", year);
      console.log("month", month);
      console.log("quincena", quincena);
    let startDate, endDate;
    if (typeof quincena === "string") {
      // Si quincena es una cadena de texto
      startDate = new Date(year, month - 1, quincena === "1" ? 1 : 16);
      endDate = new Date(year, month, quincena === "1" ? 15 : 0);
    } else {
      // Si quincena es un número
      startDate = new Date(year, month - 1, quincena === 1 ? 1 : 16);
      endDate = new Date(year, month, quincena === 1 ? 15 : 0);
    }

    // Consulta para envíos
    const shipmentProfit = await ShipmentsModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          shipmentProfit: { $sum: { $toDecimal: "$utilitie_lic" } },
          packingProfit: {
            $sum: {
              $cond: [
                { $eq: ["$packing.answer", "Si"] },
                { $toDecimal: "$packing.packing_cost" },
                0,
              ],
            },
          },
        },
      },
    ]);

    // // Consulta para servicios (asumiendo que existe un modelo de Servicios)
    // const servicesProfit = await ServicesModel.aggregate([
    //   {
    //     $match: {
    //       user_id: new mongoose.Types.ObjectId(userId),
    //       createdAt: { $gte: startDate, $lte: endDate }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       servicesProfit: { $sum: { $toDecimal: "$profit" } }
    //     }
    //   }
    // ]);

    // // Consulta para recargas (asumiendo que existe un modelo de Recargas)
    // const rechargesProfit = await RechargesModel.aggregate([
    //   {
    //     $match: {
    //       user_id: new mongoose.Types.ObjectId(userId),
    //       createdAt: { $gte: startDate, $lte: endDate }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       rechargesProfit: { $sum: { $toDecimal: "$profit" } }
    //     }
    //   }
    // ]);

    // Combinar resultados
    const result = {
      shipmentProfit: shipmentProfit[0]?.shipmentProfit || 0,
      packingProfit: shipmentProfit[0]?.packingProfit || 0,
      // servicesProfit: servicesProfit[0]?.servicesProfit || 0,
      // rechargesProfit: rechargesProfit[0]?.rechargesProfit || 0
    };

    return dataResponse("Utilidad quincenal calculada exitosamente", result);
  } catch (error) {
    console.error("Error al calcular la utilidad quincenal:", error);
    return errorResponse("No se pudo calcular la utilidad quincenal");
  }
}

module.exports = {
  createShipment,
  shipmentProfit,
  getUserShipments,
  globalProfit,
  getAllShipments,
  payShipments,
  userPendingShipments,
  userShipments,
  detailShipment,
  getProfitPacking,
  saveGuide,
  deleteShipment,
  getQuincenalProfit,
  updateShipment,
  createShipmentCustomer,
  getShipmentPaid 
};
