const ShipmentsModel = require("../models/ShipmentsModel");
const LockerModel = require("../models/LockerModel");
const UserPackingInventoryModel = require("../models/UserPackingModel");
const PackingTransactionModel = require("../models/PackingTransactionModel");
const PackingModel = require("../models/PackingModel");
const UserModel = require("../models/UsersModel");
const CustomerModel = require("../models/CustomerModel");
const EmployeesModel = require("../models/EmployeesModel");
const WalletModel = require("../models/WalletsModel");
const CashRegisterModel = require("../models/CashRegisterModel");
const CashTransactionModel = require("../models/CashTransactionModel");
const TransactionModel = require("../models/TransactionsModel");
const GavetaModel = require("../models/GabetaModel");
const TransactionHistoryModel = require("../models/HistoryTransaction");
const CuponModel = require("../models/CuponModel");
const nodemailer = require("nodemailer");
const ClipRembolsoModel = require("../models/ClipModel");

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
      status,
      extra_price,
      discount,
      dagpacket_profit,
      utilitie_dag,
      utilitie_lic,
      description,
      provider,
      apiProvider,
      idService,
      sub_user_id,
      cupon,
    } = req.body;

    console.log("Creando envío para el usuario:", sub_user_id);

    const userId = req.params.userId;
    let fistUserRole;
    let CouponExist;

    if (cupon && cupon.cupon_code) {
      CouponExist = await CuponModel.findOne({
        code: cupon.cupon_code,
      }).session(session);
      if (!CouponExist) {
        throw new Error("Cupón no encontrado");
      }
      if (CouponExist.quantity <= 0 && !CouponExist.is_unlimited) {
        throw new Error("Cupón sin existencias");
      }

      if (CouponExist.expiration_date < new Date()) {
        throw new Error("Cupón vencido");
      }

      // Solo reducir la cantidad si NO es ilimitado
      if (!CouponExist.is_unlimited) {
        CouponExist.quantity -= 1;
        await CouponExist.save({ session }); // Guardamos el cambio en la base de datos
      }

      console.log("Cupón encontrado:", CouponExist);
    }

    console.log("Creando envío para el usuario:", userId);
    console.log("Datos del envío:", req.body);

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    let actualUser = userId;

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

      PackingTransactionModel;

      packing = {
        answer: "Si",
        packing_id: requestPacking.packing_id,
        packing_type: packingInfo.type,
        packing_cost: parseFloat(packingInfo.cost_price.toString()), // Convertido a número
        packing_sell_price: parseFloat(packingInfo.sell_price.toString()), // Convertido a número
        utilitie_dag: parseFloat(
          (
            (parseFloat(packingInfo.sell_price.toString()) -
              parseFloat(packingInfo.cost_price.toString())) *
            0.3
          ).toFixed(2)
        ), // Redondeado a 2 decimales
        utilitie_lic: parseFloat(
          (
            (parseFloat(packingInfo.sell_price.toString()) -
              parseFloat(packingInfo.cost_price.toString())) *
            0.7
          ).toFixed(2)
        ), // Redondeado a 2 decimales
      };
    }

    const newShipment = new ShipmentsModel({
      user_id: userId,
      sub_user_id: sub_user_id,
      shipment_type,
      from,
      to,
      payment: {
        ...payment,
        status: "En Carrito",
      },
      packing,
      shipment_data,
      insurance,
      cost,
      price,
      cupon: cupon
        ? {
            cupon_code: cupon.cupon_code,
            cupon_type: cupon.cupon_type,
            cupon_discount_dag: cupon.cupon_discount_dag,
            cupon_discount_lic: cupon.cupon_discount_lic,
            cupon_id: CouponExist ? CouponExist._id : null, // Solo si el cupón existe
          }
        : {}, // Si no hay cupon, no lo incluye
      extra_price,
      discount,
      dagpacket_profit,
      utilitie_dag,
      utilitie_lic,
      description,
      provider,
      apiProvider,
      idService,
    });

    // Si tiene cantidad disponible y no es ilimitado, restamos 1

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

async function addShipmentToCar(req) {
  try {
    const { id } = req.params;

    const shipment = await ShipmentsModel.findById(id);

    if (!shipment) {
      return errorResponse("Envío no encontrado");
    }

    if (
      shipment.payment.status !== "Pendiente" ||
      shipment.payment.status === "En Carrito"
    ) {
      return errorResponse(
        "El envío ya está en el carrito o no está pendiente"
      );
    }

    shipment.payment.status = "En Carrito";

    await shipment.save();
    return successResponse("Envío agregado al carrito", shipment);
  } catch (error) {
    console.error("Error al agregar el envío al carrito:", error);
    return errorResponse(error.message);
  }
}

async function createLockerShipment(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      shipment_type,
      from,
      to,
      payment,
      shipment_data,
      insurance,
      cost,
      price,
      status,
      extra_price,
      discount,
      dagpacket_profit,
      description,
      provider,
      apiProvider,
      idService,
      locker_id,
    } = req.body;

    console.log("Creando envío para el locker:", locker_id);
    console.log("Datos del envío:", req.body);

    // Verificar si el locker existe
    const locker = await LockerModel.findById(locker_id).session(session);
    if (!locker) {
      throw new Error("Locker no encontrado");
    }

    const newShipment = new ShipmentsModel({
      locker_id,
      shipment_type,
      from,
      to,
      payment: {
        ...payment,
        status: "Pendiente",
      },
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

    await session.commitTransaction();
    const shipmentId = newShipment._id.toString();
    console.log("Envío creado:", shipmentId);
    const qrImage = await QRCode.toDataURL(shipmentId);
    const qrImageBuffer = Buffer.from(qrImage.split(",")[1], "base64");

    const attachments = [
      {
        filename: `codigo-qr-${shipmentId}.png`,
        content: qrImageBuffer,
        contentType: "image/png",
      },
    ];

    // Enviar correo al remitente
    await sendEmail(
      from.email,
      "Pedido creado exitosamente",
      `
          <p>Estimado/a ${from.name},</p>
          <p>Su pedido ha sido creado exitosamente.</p>
          <p>El número de folio es: <strong>${shipmentId}</strong></p>
          <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>
          <p>Su paquete será entregado en el locker seleccionado.</p>
          <p>Gracias por usar nuestros servicios.</p>

          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
        `,
      attachments
    );

    // Enviar correo al destinatario
    await sendEmail(
      to.email,
      "Nuevo envío en camino",
      `
    <p>Estimado/a ${to.name},</p>
    <p>Se ha generado un nuevo envío para usted.</p>
    <p>El número de seguimiento es: <strong>${shipmentId}</strong></p>
    <p>Su paquete estará disponible para recoger en el locker asignado.</p>
    <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>
    <p>Gracias por usar nuestros servicios.</p>
    
    <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
    <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
  `,
      attachments
    );

    return {
      success: true,
      message: "Envío creado exitosamente",
      shipment: newShipment._id.toJSON(),
      shipmentData: newShipment,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error al crear el envío:", error);
    return errorResponse(error.message);
  } finally {
    session.endSession();
  }
}

async function getShipmentsByLocker(req) {
  try {
    const { locker_id } = req.params;
    console.log("Valor de locker_id:", locker_id);

    const shipments = await ShipmentsModel.find({
      locker_id: locker_id,
    }).populate("user_id");

    console.log("Envíos encontrados:", shipments.length);

    if (!shipments) {
      throw new Error("No se encontraron envíos para este locker");
    }

    return successResponse(shipments);
  } catch (error) {
    console.error("Error al obtener los envíos del locker:", error);
    return errorResponse(error.message);
  }
}

async function requestCodeForActionGaveta(req) {
  try {
    const { id } = req.params; // ID del locker
    const { gaveta_id, user_id } = req.body; // Datos recibidos en el cuerpo de la solicitud

    // Validar que los parámetros requeridos estén presentes
    if (!id || !gaveta_id || !user_id) {
      return errorResponse("Faltan datos requeridos: id, gaveta_id o user_id.");
    }

    // Buscar locker
    const locker = await LockerModel.findById(id);
    if (!locker) {
      return errorResponse("Locker no encontrado.");
    }

    // Buscar usuario
    const user = await UserModel.findById(user_id);
    if (!user) {
      return errorResponse("Usuario no encontrado.");
    }
    console.log("Usuario encontrado:", user);

    // Buscar gaveta
    const gaveta = await GavetaModel.findById(gaveta_id);
    if (!gaveta) {
      return errorResponse("Gaveta no encontrada.");
    }

    // Generar código aleatorio
    const code = Math.floor(100000 + Math.random() * 900000);

    // Actualizar el código en la gaveta
    gaveta.code = code;
    await gaveta.save();
    const qrImage = await QRCode.toDataURL(code.toString());
    const qrImageBuffer = Buffer.from(qrImage.split(",")[1], "base64");
    const attachments = [
      {
        filename: `codigo-qr-${code}.png`,
        content: qrImageBuffer,
        contentType: "image/png",
      },
    ];
    // Enviar email al usuario
    await sendEmail(
      user.email,
      "Código de acceso para acción de gaveta",
      `
        <p>Estimado/a ${user.name},</p>
        <p>Se ha generado un código de acceso para la acción de la gaveta ${gaveta_id}.</p>
        <p>Gracias por usar nuestros servicios.</p>
      `,
      attachments
    );

    return successResponse("Código generado exitosamente.");
  } catch (error) {
    console.error("Error al solicitar código para acción de gaveta:", error);
    return errorResponse("No se pudo solicitar el código para la acción.");
  }
}

async function validateCodeForActionGaveta(req) {
  try {
    const { id } = req.params;
    const { gaveta_id, code } = req.body;
    const locker = await LockerModel.findById(id);

    if (!locker) {
      return errorResponse("Locker no encontrado");
    }

    const gaveta = await GavetaModel.findById(gaveta_id);

    if (!gaveta) {
      return errorResponse("Gaveta no encontrada");
    }

    if (gaveta.code !== code) {
      return errorResponse("Código incorrecto");
    }

    return successResponse("Código correcto");
  } catch (error) {
    console.error("Error al validar código para acción de gaveta:", error);
    return errorResponse("No se pudo validar el código para la acción");
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
          packing_cost: parseFloat(packingInfo.cost_price.toString()), // Convertido a número
          packing_sell_price: parseFloat(packingInfo.sell_price.toString()), // Convertido a número
          utilitie_dag: parseFloat(
            (
              (parseFloat(packingInfo.sell_price.toString()) -
                parseFloat(packingInfo.cost_price.toString())) *
              0.3
            ).toFixed(2)
          ), // Redondeado a 2 decimales
          utilitie_lic: parseFloat(
            (
              (parseFloat(packingInfo.sell_price.toString()) -
                parseFloat(packingInfo.cost_price.toString())) *
              0.7
            ).toFixed(2)
          ), // Redondeado a 2 decimales
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

async function validateDimentions(req) {
  try {
    const { id } = req.params;
    const { length, width, height, weight } = req.body;

    const shipment = await ShipmentsModel.findById(id);
    if (!shipment) {
      return errorResponse("Envío no encontrado");
    }

    // Definir tolerancias
    const toleranceCm = 0.1; // cm
    const toleranceGrams = 0.2; // gramos

    // Obtener las dimensiones y el peso del envío desde la base de datos
    const shipmentData = shipment.shipment_data;

    console.log("Dimensiones del envío:", shipmentData);
    // Validar dimensiones con tolerancia
    if (
      length > shipmentData.length ||
      length < shipmentData.length - toleranceCm ||
      width > shipmentData.width ||
      width < shipmentData.width - toleranceCm ||
      height > shipmentData.height ||
      height < shipmentData.height - toleranceCm
    ) {
      return errorResponse("Las dimensiones exceden la variación permitida");
    }

    // Validar peso con tolerancia
    if (
      weight > shipmentData.weight ||
      weight < shipmentData.weight - toleranceGrams
    ) {
      return errorResponse("El peso excede la variación permitida");
    }

    return successResponse(
      "Dimensiones y peso válidos dentro del rango permitido"
    );
  } catch (error) {
    console.error("Error al validar las dimensiones del envío:", error);
    return errorResponse("No se pudo validar las dimensiones del envío");
  }
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
      populate: {
        path: "user_id sub_user_id",
        model: "Users",
        select: "name email",
      },
    };

    const filter = {
      $or: [{ user_id: id }, { sub_user_id: id }],
    };
    const shipments = await ShipmentsModel.paginate(filter, options);

    console.log("Envíos encontrados:", shipments.docs);

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

    // Primero, obtener los envíos individuales que contribuyen a la suma
    const shipments = await ShipmentsModel.find({
      paid_at: {
        $gte: new Date(currentYear, currentMonth, 1), // Inicio del mes actual
        $lt: new Date(currentYear, currentMonth + 1, 1), // Inicio del próximo mes
      },
    }).select(
      "guide_number trackingNumber idService utilitie_dag paid_at price"
    );

    // Luego, hacer el agregado para obtener la suma total
    const result = await ShipmentsModel.aggregate([
      {
        $match: {
          paid_at: {
            $gte: new Date(currentYear, currentMonth, 1), // Inicio del mes actual
            $lt: new Date(currentYear, currentMonth + 1, 1), // Inicio del próximo mes
          },
        },
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: { $toDouble: "$utilitie_dag" } },
          totalShipments: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: "$price" } },
        },
      },
      {
        $project: {
          _id: 0,
          month: currentMonth + 1, // Ajustamos para que sea 1-12 en lugar de 0-11
          totalProfit: { $round: ["$totalProfit", 2] },
          totalShipments: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
        },
      },
    ]);

    // Si no hay resultados, devolvemos un objeto con utilidad 0
    const monthlyProfit = result[0] || {
      month: currentMonth + 1,
      totalProfit: 0,
      totalShipments: 0,
      totalAmount: 0,
    };

    // Formateamos los envíos para facilitar su visualización
    const formattedShipments = shipments.map((s) => ({
      guide_number: s.guide_number,
      trackingNumber: s.trackingNumber,
      idService: s.idService,
      utilitie_dag: parseFloat(s.utilitie_dag?.toString() || "0"),
      price: parseFloat(s.price?.toString() || "0"),
      paid_at: s.paid_at,
    }));

    return successResponse({
      monthlyProfit,
      dateRange: {
        startDate: new Date(currentYear, currentMonth, 1).toISOString(),
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString(), // Último día del mes actual
      },
      shipments: formattedShipments,
    });
  } catch (error) {
    console.log(
      "No se pudo calcular la ganancia global para el mes actual: " + error
    );
    return errorResponse(
      "No se pudo calcular la ganancia global para el mes actual: " +
        error.message
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
      searchName,
      status,
      dateFrom,
      dateTo,
    } = req.query;

    // Construir el filtro base
    const filter = {};

    // Filtro por nombre o email
    if (searchName) {
      filter.$or = [
        { "user_id.name": { $regex: searchName, $options: "i" } },
        { "user_id.email": { $regex: searchName, $options: "i" } },
        { "sub_user_id.name": { $regex: searchName, $options: "i" } },
        { "sub_user_id.email": { $regex: searchName, $options: "i" } },
      ];
    }

    console.log("Filtro de búsqueda:", filter);

    // Filtro por estado
    if (status) {
      filter.status = status;
    }

    // Filtro por rango de fechas
    if (dateFrom && dateTo) {
      filter.distribution_at = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },

      populate: {
        path: "user_id sub_user_id",
        model: "Users",
        select: "name email",
      },
    };

    const shipments = await ShipmentsModel.paginate(filter, options);

    console.log("Envíos encontrados:", shipments.docs);

    if (shipments.docs.length === 0) {
      return errorResponse(
        "No se encontraron envíos que coincidan con los filtros"
      );
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
      packing,
      searchBy,
      searchValue,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      populate: [
        {
          path: "user_id",
          select: "name surname email", // Datos del usuario principal
        },
        {
          path: "sub_user_id",
          select: "name surname email", // Datos del subusuario
        },
      ],
    };

    console.log("Opciones de búsqueda:", options);

    // Filtro base: solo envíos pagados
    let filter = { "payment.status": "Pagado" };

    // Validar que searchBy tenga un valor permitido
    const allowedFields = [
      "user_id",
      "sub_user_id",
      "name",
      "surname",
      "email",
    ];

    if (searchBy && !allowedFields.includes(searchBy)) {
      return errorResponse(
        `El campo '${searchBy}' no es válido para la búsqueda.`
      );
    }

    // Si la búsqueda es por user_id o sub_user_id, validar que sea un ObjectId
    if (searchBy === "user_id" || searchBy === "sub_user_id") {
      if (!mongoose.Types.ObjectId.isValid(searchValue)) {
        return errorResponse(
          `El ${searchBy} '${searchValue}' no es un ObjectId válido.`
        );
      }
      filter[searchBy] = searchValue;
    }

    // Si es por name, surname o email, buscar en la colección Users
    if (searchBy && !["user_id", "sub_user_id"].includes(searchBy)) {
      const userFilter = { [searchBy]: new RegExp(searchValue, "i") };
      const users = await UserModel.find(userFilter).select("_id");

      if (!users.length) {
        return errorResponse(
          `No se encontraron usuarios con ${searchBy}: '${searchValue}'`
        );
      }

      // Extraer los ObjectId de los usuarios encontrados
      const userIds = users.map((user) => user._id);
      filter["$or"] = [
        { user_id: { $in: userIds } },
        { sub_user_id: { $in: userIds } },
      ];
    }

    // Filtrar por packing si es 'Si' o 'No'
    if (packing === "Si" || packing === "No") {
      filter["packing.answer"] = packing;
    }

    const shipments = await ShipmentsModel.paginate(filter, options);

    if (shipments.docs.length === 0) {
      return errorResponse(
        `No se encontraron envíos pagados${
          packing ? ` con packing '${packing}'` : ""
        }${searchBy && searchValue ? ` con ${searchBy} '${searchValue}'` : ""}`
      );
    }

    return dataResponse(
      `Envíos pagados encontrados${packing ? ` con packing '${packing}'` : ""}${
        searchBy && searchValue ? ` con ${searchBy} '${searchValue}'` : ""
      }`,
      {
        shipments: shipments.docs,
        totalPages: shipments.totalPages,
        currentPage: shipments.page,
        totalShipments: shipments.totalDocs,
      }
    );
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
    let fistUserRole;

    let user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Determinar el usuario cuyo wallet y porcentaje de utilidad se usará
    let actualUserId = userId;
    let utilityPercentage;
    if (user.role === "CAJERO" && user.parentUser) {
      fistUserRole = user.role;
      actualUserId = user.parentUser;
      user = await UserModel.findById(actualUserId).session(session);
      if (!user) {
        throw new Error("Usuario padre no encontrado");
      }
    } else {
      fistUserRole = user.role;
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

        // Actualizar el estado del envío
        shipment.payment.status = "Pagado";
        shipment.status = "Guia Generada";
        shipment.paid_at = new Date();
        shipment.payment.method = paymentMethod;
        shipment.payment.transaction_number =
          transactionNumber || `${Date.now()}`;

        await shipment.save({ session });
      }
    }

    const sendBalance = parseFloat(wallet.sendBalance.toString());
    if (sendBalance < totalPrice) {
      throw new Error("Saldo insuficiente en la cuenta para envíos");
    }
    wallet.sendBalance = sendBalance - totalPrice;
    await wallet.save({ session });
    const previous_balance =
      parseFloat(wallet.sendBalance.toString()) + totalPrice;

    // Registrar la transacción general
    const transaction = new TransactionModel({
      user_id:
        user.role === "LICENCIATARIO_TRADICIONAL" ? user._id : actualUserId,
      sub_user_id: userId,
      shipment_ids: ids,
      service: "Envíos",
      transaction_number: transactionNumber || `${Date.now()}`,
      payment_method: paymentMethod,
      previous_balance: previous_balance.toFixed(2),
      amount: totalPrice.toFixed(2),
      new_balance: (previous_balance - totalPrice).toFixed(2),
      details: `Pago de ${shipments.length} envío(s)`,
      status: "Pagado",
    });

    // Verificar saldo del wallet si el método de pago es 'saldo'
    if (paymentMethod === "td-debito" || paymentMethod === "td-credito") {
      const clipRembolso = new ClipRembolsoModel({
        operation_by: user._id,
        shipment_ids: ids,
        transaction_id: transaction._id,
        amount: totalPrice,
        service: "envio",
      });

      await clipRembolso.save({ session });

      // Actualizar el saldo del wallet

    }

    await transaction.save({ session });
    // Manejar el registro de caja
    let currentCashRegister;

    if (fistUserRole === "CAJERO") {
      // For cashiers, search by their own employee_id
      currentCashRegister = await CashRegisterModel.findOne({
        employee_id: userId,
        status: "open",
      }).session(session);
    } else if (fistUserRole === "LICENCIATARIO") {
      // For licensees, search by their licensee_id
      currentCashRegister = await CashRegisterModel.findOne({
        licensee_id: actualUserId,
        status: "open",
      }).session(session);
    } else {
      // Handle other roles or throw an error
      currentCashRegister = await CashRegisterModel.findOne({
        $or: [{ licensee_id: actualUserId }, { employee_id: actualUserId }],
        status: "open",
      }).session(session);
    }

    if (currentCashRegister) {
      // Registrar la transacción en la caja
      const cashTransaction = new CashTransactionModel({
        cash_register_id: currentCashRegister._id,
        transaction_id: transaction._id,
        operation_by: userId,
        payment_method: paymentMethod,
        amount: totalPrice,
        type: "ingreso",
        transaction_number: transaction.transaction_number,
        description: `Pago de ${shipments.length} envío(s)`,
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

async function payLockerShipment(req) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shipmentId, paymentMethod, transactionNumber } = req.body;

    const shipment = await ShipmentsModel.findById(shipmentId).session(session);
    if (!shipment) {
      throw new Error("No se encontró el envío especificado");
    }

    if (shipment.payment.status === "Pagado") {
      throw new Error("Este envío ya ha sido pagado");
    }

    const price = parseFloat(shipment.price.toString());
    const dagpacketProfit = parseFloat(shipment.dagpacket_profit.toString());
    const discount = parseFloat(shipment.discount.toString());

    let totalUtilitie = dagpacketProfit + discount;
    const utilityLic = totalUtilitie * 0.7 - discount;
    const utilityDag = dagpacketProfit - utilityLic;

    // Actualizar el envío
    shipment.utilitie_lic = utilityLic.toFixed(2);
    shipment.utilitie_dag = utilityDag.toFixed(2);
    shipment.payment.status = "Pagado";
    shipment.status = "Guia Generada";
    shipment.payment.method = paymentMethod;
    shipment.payment.transaction_id = transactionNumber || `ID-${Date.now()}`;

    await shipment.save({ session });

    // Registrar la transacción
    const transaction = new TransactionModel({
      shipment_ids: [shipmentId],
      service: "Envío Locker",
      transaction_number: transactionNumber || `ID-${Date.now()}`,
      payment_method: paymentMethod,
      amount: price.toFixed(2),
      details: `Pago de envío en locker`,
      status: "Pagado",
      type: "LOCKER",
    });

    await transaction.save({ session });

    // Enviar correo al remitente
    await sendEmail(
      shipment.from.email,
      "Pago confirmado - Envío en Locker",
      `
        <p>Estimado/a ${shipment.from.name},</p>
        <p>El pago de su envío ha sido procesado exitosamente.</p>
        <p>Detalles de la transacción:</p>
        <ul>
          <li>Número de transacción: ${transaction.transaction_number}</li>
          <li>Método de pago: ${paymentMethod}</li>
          <li>Monto: $${price}</li>
        </ul>
        <p>Su paquete será procesado y enviado al locker seleccionado.</p>
        <p>Gracias por usar nuestros servicios.</p>
        <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
      `
    );

    // Correo al destinatario
    await sendEmail(
      shipment.to.email,
      "Envío pagado - Disponible pronto en Locker",
      `
        <p>Estimado/a ${shipment.to.name},</p>
        <p>El envío a su nombre ha sido pagado y será procesado.</p>
        <p>Pronto recibirá las instrucciones para recoger su paquete en el locker asignado.</p>
        <p>Número de seguimiento: ${shipment._id}</p>
        <p>Gracias por usar nuestros servicios.</p>
        <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
      `
    );

    await session.commitTransaction();
    return {
      success: true,
      message: "Envío pagado exitosamente",
      shipment: shipmentId,
      totalPrice: price,
      transaction_number: transaction.transaction_number,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error al pagar envío de locker:", error);
    return { success: false, message: error.message };
  } finally {
    session.endSession();
  }
}

async function userPendingShipments(req) {
  try {
    const { id } = req.params;
    const pendingShipments = await ShipmentsModel.find({
      $or: [{ user_id: id }, { sub_user_id: id }],
      "payment.status": "En Carrito",
    }).sort({ createdAt: -1 });

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

async function userPendingShipmentsNotInCar(req) {
  try {
    const { id } = req.params;
    const pendingShipments = await ShipmentsModel.find({
      $or: [{ user_id: id }, { sub_user_id: id }],
      "payment.status": "Pendiente",
    }).sort({ createdAt: -1 });

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

    // Validación de parámetros
    if (!userId || !year || !month || !quincena) {
      return errorResponse(
        "Todos los parámetros son requeridos: userId, year, month, quincena"
      );
    }

    // Parseo de parámetros a números
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const quincenaNum = parseInt(quincena);

    console.log("userId:", userId);
    console.log("year:", yearNum);
    console.log("month:", monthNum);
    console.log("quincena:", quincenaNum);

    // Validación adicional
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(quincenaNum)) {
      return errorResponse("Año, mes y quincena deben ser valores numéricos");
    }

    // Establecer las fechas de inicio y fin
    let startDate, endDate;

    if (quincenaNum === 1) {
      startDate = new Date(yearNum, monthNum - 1, 1);
      endDate = new Date(yearNum, monthNum - 1, 15);
    } else if (quincenaNum === 2) {
      startDate = new Date(yearNum, monthNum - 1, 16);
      endDate = new Date(yearNum, monthNum, 0);
    } else {
      return errorResponse("Quincena debe ser 1 o 2");
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log("Filtrando envíos con paid_at entre:", startDate, "y", endDate);

    // Consulta para envíos
    const shipmentProfit = await ShipmentsModel.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          paid_at: { $gte: startDate, $lte: endDate },
          "payment.status": "Pagado",
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
                { $toDecimal: "$packing.utilitie_lic" },
                0,
              ],
            },
          },
          totalShipments: { $sum: 1 },
        },
      },
    ]);

    // Preparar el resultado con valores numéricos
    const result = {
      shipmentProfit: 0,
      packingProfit: 0,
      totalShipments: 0,
      totalProfit: 0, // 🔹 Suma total de utilidades
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };

    // Si hay resultados, actualizarlos
    if (shipmentProfit.length > 0) {
      result.shipmentProfit = parseFloat(shipmentProfit[0].shipmentProfit) || 0;
      result.packingProfit = parseFloat(shipmentProfit[0].packingProfit) || 0;
      result.totalShipments = shipmentProfit[0].totalShipments || 0;
      result.totalProfit = result.shipmentProfit + result.packingProfit; // 🔹 Suma de utilidades
    }

    return dataResponse("Utilidad quincenal calculada exitosamente", result);
  } catch (error) {
    console.error("Error al calcular la utilidad quincenal:", error);
    return errorResponse(
      `No se pudo calcular la utilidad quincenal: ${error.message}`
    );
  }
}

async function getShipmentByTracking(req) {
  try {
    const { tracking } = req.params;
    const shipment = await ShipmentsModel.findOne({ trackingNumber: tracking });
    console.log("shipment", shipment);
    if (shipment) {
      return dataResponse("Envío encontrado", shipment);
    } else {
      return errorResponse("No se encontró el envío");
    }
  } catch (error) {
    console.error("Error al buscar el envío:", error);
    return errorResponse("Error al buscar el envío");
  }
}

async function removeShipmentToCar(req) {
  try {
    const { id } = req.params;
    const shipment = await ShipmentsModel.findById(id);

    if (!shipment) {
      return errorResponse("El envío no existe");
    }

    console.log("shipment", shipment);

    // Verificar que el estado sea "En Carrito" y que NO esté "Pagado"
    if (
      shipment.payment.status !== "En Carrito" ||
      shipment.payment.status === "Pagado"
    ) {
      return errorResponse("Solo los envíos en carrito pueden ser eliminados");
    }

    console.log("Antes de cambiar a Pendiente", shipment.payment.status);

    // Cambiar el estado del envío a "Pendiente" o "Cancelado"
    shipment.payment.status = "Pendiente"; // O "Cancelado" según tu lógica

    console.log("Después de cambiar a Pendiente", shipment.payment.status);

    await shipment.save();

    return successResponse("Envío eliminado del carrito exitosamente", {
      shipmentId: id,
    });
  } catch (error) {
    console.error("Error al eliminar el envío del carrito:", error);
    return errorResponse("Error al eliminar el envío del carrito", error);
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
  getShipmentPaid,
  getShipmentByTracking,
  createLockerShipment,
  payLockerShipment,
  getShipmentsByLocker,
  requestCodeForActionGaveta,
  validateCodeForActionGaveta,
  validateDimentions,
  addShipmentToCar,
  removeShipmentToCar,
  userPendingShipmentsNotInCar,
};
