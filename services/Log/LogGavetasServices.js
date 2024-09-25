const LogGaveta = require("../../models/Log/LogGavetaModel");

const {
  successResponse,
  errorResponse,
  dataResponse,
} = require("../../helpers/ResponseHelper");

async function createLogGaveta(req, res) {
  const {
    locker_id,
    gabeta_id,
    client_id,
    account_id,
    purchase_id,
    action,
    sell,
    buy,
    profit,
    delivery,
    technician,
    delivery_driver,
    delivery_person,
  } = req.body;

  try {
    const logGaveta = new LogGaveta({
      locker_id,
      gabeta_id,
      client_id,
      account_id,
      purchase_id,
      action,
      sell,
      buy,
      profit,
      delivery,
      technician,
      delivery_driver,
      delivery_person,
    });

    await logGaveta.save();
    return successResponse("Gaveta creada exitosamente");
  } catch (error) {
    return errorResponse("Error al crear la gaveta");
  }
}

async function getLogGavetas(req, res) {
  try {
    const logGavetas = await LogGaveta.find();
    return successResponse(res, logGavetas);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}



module.exports = {
  createLogGaveta,
  getLogGavetas,

};