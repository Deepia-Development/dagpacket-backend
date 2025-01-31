const GabetaModel = require("../models/GabetaModel");
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../helpers/ResponseHelper");
const { ObjectId } = require("mongoose").Types;
function generateRandomPin(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Utiliza TLS
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  },
  debug: true
});

async function sendEmail(to, subject, content,attachments) {
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
      attachments: attachments
    });
    console.log(`Correo enviado a ${to}`);
  } catch (error) {
    console.error(`Error al enviar correo a ${to}:`, error);
  }
}

async function createGabeta(req, res) {
  const {
    id_locker,
    id_gabeta,
    size,
    weight,
    package,
    status,
    ubication,
    street,
    cp,
    city,
    state,
    country,
    saturation,
    type,
    gabeta_dimension,
  } = req.body;

  // Generar PIN y client PIN automáticamente
  const pin = generateRandomPin(10);
  const client_pin = generateRandomPin(10);

  try {
    const gabeta = new GabetaModel({
      id_locker,
      id_gabeta,
      size,
      weight,
      package,
      status,
      ubication,
      street,
      cp,
      city,
      state,
      country,
      saturation,
      type,
      gabeta_dimension,
      pin, // Agregar pin generado
      client_pin, // Agregar client_pin generado
    });

    await gabeta.save();
    return successResponse("Gaveta creada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al crear la gaveta");
  }
}

async function listGabetas(req, res) {
  try {
    const gabetas = await GabetaModel.find();
    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gavetas");
  }
}

async function getGabetaByIdLocker(req, res) {
  const { id_locker } = req.body; // Usar req.body para obtener id_locker
  try {
    // Busca las gabetas utilizando el ObjectId
    const gabetas = await GabetaModel.find({
      id_locker: new ObjectId(id_locker),
    });

    // Devuelve la respuesta con los datos obtenidos
    res.status(200).json(gabetas); // Respuesta exitosa con los datos
  } catch (error) {
    console.error(error); // Log del error
    res.status(500).json({ message: "Error al obtener las gavetas" }); // Respuesta de error
  }
}

deleteGaveta = async (req, res) => {
  try {
    // Desestructurar el array de IDs del cuerpo de la solicitud
    const { ids } = req.body; 

    // Validar que se hayan proporcionado IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, "Se debe proporcionar un array de IDs válido");
    }

    // Eliminar las gavetas que coincidan con los IDs
    await GabetaModel.deleteMany({ _id: { $in: ids } });

    return successResponse("Gavetas eliminadas exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse(res, "Error al eliminar las gavetas");
  }
}


async function getAviableGabeta(req, res) {
  try {
    // Obtén el id_locker del request desde los parámetros
    const { id } = req.params; // Extraer id_locker desde el cuerpo de la solicitud

    // Asegúrate de que el idLocker sea una cadena de 24 caracteres
    if (!ObjectId.isValid(id)) {
      return errorResponse("El id_locker proporcionado no es válido");
    }

    // Convierte idLocker a ObjectId
    const objectIdLocker = new ObjectId(id);

    // Busca las gabetas que coincidan con el id_locker y que tengan saturation: false
    const gabetas = await GabetaModel.find({ 
      id_locker: objectIdLocker, // Filtra por id_locker
      saturation: false 
    });

    if (gabetas.length === 0) {
      return errorResponse("No hay gavetas disponibles para el locker especificado");
    }

    return dataResponse(gabetas);
  } catch (error) {
    console.log(error);
    return errorResponse("Error al obtener las gavetas");
  }
}


// Servicio (maneja la respuesta)
async function recolectPackage(req, res) {
  try {
    if (!req.body.pin) {
      return res.status(400).json({
        success: false,
        message: "El PIN es requerido"
      });
    }

    if (typeof req.body.pin !== 'string' || req.body.pin.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El PIN debe ser una cadena no vacía"
      });
    }

    let gabeta = await GabetaModel.findOne({ pin: req.body.pin });

    if (!gabeta) {
      gabeta = await GabetaModel.findOne({ client_pin: req.body.pin });
    }

    if (gabeta) {
      return res.status(200).json({
        success: true,
        message: "Gaveta encontrada",
        data: gabeta
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No se encontró la gaveta"
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la gaveta"
    });
  }
}


// async function recolectPackage(req,res){

// }


async function updateGabetaSaturationOnReceive(req, res) {
  try {
    console.log("Datos recibidos, para actualizar :", req.body);

    const { _id ,package, saturation } = req.body;

    if (!_id || !package || saturation === undefined) {
      return res.status(400).json({ message: "Faltan datos en la solicitud para actualizar gabeta" });
    }

    await GabetaModel.updateOne(
      { _id },
      { $set: { package, saturation } }
    );

    console.log("Gaveta actualizada exitosamente");
    return successResponse("Gaveta actualizada exitosamente");

}catch (error) {
  console.log(error);
  return errorResponse("Error al actualizar la gaveta");
}
}


async function updateSaturation(req, res) {
  
  try {
    // Muestra el body recibido en la consola
    console.log("Datos recibidos en el body para crear un paqute:", req.body);

    const { _id, package, saturation, pin, email, nombre } = req.body;
    
    // Verifica que los datos existen en el body
    if (!_id || !package || saturation || pin || email || nombre === undefined) {
      if (!pin) {
        return errorResponse("El pin es requerido");
      }
      if (!email) {
        return errorResponse("El email es requerido");
      }
      if (!nombre) {
        return errorResponse("El nombre es requerido");
      }
      
      if (!package) {
        return errorResponse("El paquete es requerido");
      }
      if (saturation === undefined) {
        return errorResponse("La saturación es requerida");
      }

   if(_id === undefined) {
      return errorResponse("El id es requerido");
   }

    }
    const qrImage = await QRCode.toDataURL(pin);
    const qrImageBuffer = Buffer.from(qrImage.split(",")[1], 'base64');
    const attachments = [
      {
        filename: `codigo-qr-${_id}.png`,  // Nombre del archivo
        content: qrImageBuffer,                   // Buffer de la imagen
        contentType: 'image/png'                  // Tipo MIME
      }
    ];
    await sendEmail(
      email,
      "Código QR para recoger el paquete creado exitosamente",
      `
        <p>Estimado/a ${nombre},</p>
        <p>Su pedido ha sido creado exitosamente.</p>
        <p>El código para recoger su paquete se ha generado:</p>
        <img src="${qrImage}" alt="Código QR para recoger el pedido" />
           <p>El Código QR lo podrá encontrar en la sección de archivos adjuntos.</p>

        <p>Gracias por usar nuestros servicios.</p>
        <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
        <p>Saludos cordiales,<br>El equipo de DAGPACKET</p>
      `,
      attachments
    );
    

    // Actualiza los campos 'package' y 'saturation'
    await GabetaModel.updateOne(
      { _id },
      { $set: { package, saturation } }
    );

    // Devuelve una respuesta con los datos recibidos y la actualización
  return successResponse("Gaveta actualizada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar la gaveta");
  }
}



async function UpdateGabeta(req, res) {
  try {
    const { _id, saturation } = req.body;
    await GabetaModel.updateOne({ _id }, { saturation });
    return successResponse("Gaveta actualizada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar la gaveta");
  }
}

async function UpdateGabetaStatus(req, res) {
  try {
    const { _id } = req.params;
    const {  status } = req.body;
    await GabetaModel.updateOne(
      { _id },
      {
        status,
      }
    );
    console.log(_id);
    console.log(status);
    return successResponse("Gaveta actualizada exitosamente");
  } catch (error) {
    console.log(error);
    return errorResponse("Error al actualizar la gaveta");
  }
}

getGavetaInfoById = async (req, res) => {
  try {
    const { _id } = req.params;
    const gaveta = await GabetaModel.findById(_id).populate("package");
    return gaveta;
  }
  catch (error) {
    console.log(error);
    return errorResponse("Error al obtener la gaveta");
  }
}

async function findGavetasByLocker(id_locker) {
  try {
    console.log("Buscando gavetas para id_locker:", id_locker);

    // Intentar convertir a ObjectId, pero manejar el error si falla
    let objectId;
    try {
      objectId = mongoose.Types.ObjectId(id_locker);
    } catch (err) {
      throw new Error("Error al convertir id_locker a ObjectId");
    }

    const gabetas = await GabetaModel.find({ id_locker: objectId });
    console.log("Gavetas encontradas:", gabetas);

    if (!gabetas || gabetas.length === 0) {
      return { message: "No se encontraron gavetas para el locker especificado" };
    }

    return gabetas;
  } catch (error) {
    console.error("Error al obtener las gavetas por id_locker:", error);
    throw new Error("Error al obtener las gavetas por id_locker");
  }
}










module.exports = {
  createGabeta,
  listGabetas,
  getGabetaByIdLocker,
  getAviableGabeta,
  recolectPackage,
  updateSaturation,
  UpdateGabeta,
  UpdateGabetaStatus,
  getGavetaInfoById,
  findGavetasByLocker,
  deleteGaveta,
  updateGabetaSaturationOnReceive
};
