const RecolectModel = require("../models/RecolectModel");

const createRecolect = async (req) => {
  try {

    const recolectData = {
        user_id: req.body.user_id,
        name: req.body.name,
        telephone: req.body.telephone,
        tracking_number: req.body.tracking_number,
        delivery: req.body.delivery,
        note: req.body.note,
        status: req.body.status,
        image64: Buffer.from(req.body.image64, 'base64')
    };

    // console.log('recolectData', recolectData);

    const newRecolect = new RecolectModel(recolectData);
    return await newRecolect.save();
  } catch (error) {
    throw new Error(error.message);
  }
};





module.exports = {
  createRecolect,
};