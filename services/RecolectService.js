
const RecolectModel = require("../models/RecolectModel");
const { dataResponse, errorResponse } = require("../helpers/ResponseHelper");

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

async function getAllRecolects(page = 1, limit = 10, searchTerm = '') {
  try {
    const skip = (page - 1) * limit;
    let filter = {};
 
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { tracking_number: { $regex: searchTerm, $options: 'i' }}
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
    let filter = { user_id: userId };
 
    if (searchTerm) {
      filter.$or = [
        { tracking_number: { $regex: searchTerm, $options: 'i' }},
        { delivery: { $regex: searchTerm, $options: 'i' }}
      ];
    }
 
    const total = await RecolectModel.countDocuments(filter);
    const recolects = await RecolectModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
 
    return dataResponse('Recolecciones del usuario recuperadas con éxito', {
      recolects,
      totalPages: Math.ceil(total / limit), 
      currentPage: page,
      totalItems: total
    });
 
  } catch (error) {
    return errorResponse('Error al obtener recolecciones del usuario: ' + error.message);
  }
 }
 


module.exports = {
  createRecolect,
  getAllRecolects,
  getRecolectsByUser
};