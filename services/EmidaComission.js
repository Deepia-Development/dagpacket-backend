const EmidaServices = require("../models/EmidaModel");

class EmidaService {
  async getService() {
    return await EmidaServices.find();
  }

  async createService(comission) {
    if (!comission) {
      throw new Error("Comission is required");
    }

    const comissionExist = await EmidaServices.findOne({ comission });

    if (comissionExist) {
      throw new Error("Comission already exist");
    }

    return await EmidaServices.create({ comission });
  }

  async updateService(req) {
    const { comission } = req.body;
    if (!comission) {
      throw new Error("Comission is required");
    }
    console.log("Update comission request:", comission);
    return await EmidaServices.findOneAndUpdate({ comission });
  }

  async deleteService(id) {
    return await EmidaServices.findByIdAndDelete(id);
  }
}


module.exports = new EmidaService();