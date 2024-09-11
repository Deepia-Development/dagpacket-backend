const Contract = require('../models/ContractModel');
const User = require('../models/UsersModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

class ContractService {
  async createContract(userId, contractType) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse('Usuario no encontrado');
      }

      const existingContract = await Contract.findOne({ user: userId });
      if (existingContract) {
        return errorResponse('El usuario ya tiene un contrato asignado');
      }

      const newContract = new Contract({
        user: userId,
        type: contractType
      });

      await newContract.save();
      return successResponse('Contrato creado exitosamente');
    } catch (error) {
      console.error('Error al crear el contrato:', error);
      return errorResponse('Error al crear el contrato');
    }
  }

  async getContractByUserId(userId) {
    try {
      const contract = await Contract.findOne({ user: userId });
      if (!contract) {
        return errorResponse('Contrato no encontrado para este usuario');
      }
      return dataResponse('Contrato encontrado', contract);
    } catch (error) {
      console.error('Error al obtener el contrato:', error);
      return errorResponse('Error al obtener el contrato');
    }
  }

  async updateContract(userId, contractType) {
    try {
      const contract = await Contract.findOneAndUpdate(
        { user: userId },
        { type: contractType },
        { new: true }
      );
      if (!contract) {
        return errorResponse('Contrato no encontrado para este usuario');
      }
      return successResponse('Contrato actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el contrato:', error);
      return errorResponse('Error al actualizar el contrato');
    }
  }
}

module.exports = new ContractService();