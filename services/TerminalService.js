const TerminalModel = require("../models/terminalModel");
const { dataResponse, errorResponse } = require("../helpers/ResponseHelper");

class TerminalService {
  // CREATE - Crear una nueva terminal
  async createTerminal(terminalData) {
    try {
      const newTerminal = new TerminalModel(terminalData);
      const savedTerminal = await newTerminal.save();
      return dataResponse("Terminal creada exitosamente", savedTerminal);
    } catch (error) {
      return errorResponse("Error al crear la terminal", error.message);
    }
  }

  // READ - Obtener todas las terminales
  async getAllTerminals() {
    try {
      const terminals = await TerminalModel.find().populate("locker_id");
      return dataResponse("Terminales obtenidas exitosamente", terminals);
    } catch (error) {
      return errorResponse("Error al obtener las terminales", error.message);
    }
  }

  // READ - Obtener una terminal por ID
  async getTerminalById(id) {
    try {
      const terminal = await TerminalModel.findById(id).populate("locker_id");
      if (!terminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con ese ID"
        );
      }
      return dataResponse("Terminal obtenida exitosamente", terminal);
    } catch (error) {
      return errorResponse("Error al obtener la terminal", error.message);
    }
  }

  // READ - Obtener terminal por número de serie
  async getTerminalBySN(sn) {
    try {
      const terminal = await TerminalModel.findOne({ sn }).populate(
        "locker_id"
      );
      if (!terminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con ese número de serie"
        );
      }
      return dataResponse("Terminal obtenida exitosamente", terminal);
    } catch (error) {
      return errorResponse(
        "Error al obtener la terminal por SN",
        error.message
      );
    }
  }

  // READ - Obtener terminal por IP
  async getTerminalByIP(ip) {
    try {
      const terminal = await TerminalModel.findOne({ ip }).populate(
        "locker_id"
      );
      if (!terminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con esa IP"
        );
      }
      return dataResponse("Terminal obtenida exitosamente", terminal);
    } catch (error) {
      return errorResponse(
        "Error al obtener la terminal por IP",
        error.message
      );
    }
  }

  // READ - Obtener terminales por locker_id
  async getTerminalsByLockerId(lockerId) {
    try {
      const terminals = await TerminalModel.find({
        locker_id: lockerId,
      }).populate("locker_id");
      return dataResponse("Terminales obtenidas exitosamente", terminals);
    } catch (error) {
      return errorResponse(
        "Error al obtener terminales por locker",
        error.message
      );
    }
  }

  // UPDATE - Actualizar una terminal por ID
  async updateTerminal(id, updateData) {
    try {
      const updatedTerminal = await TerminalModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate("locker_id");

      if (!updatedTerminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con ese ID"
        );
      }
      return dataResponse("Terminal actualizada exitosamente", updatedTerminal);
    } catch (error) {
      return errorResponse("Error al actualizar la terminal", error.message);
    }
  }

  // UPDATE - Actualizar parcialmente una terminal
  async patchTerminal(id, patchData) {
    try {
      const terminal = await TerminalModel.findById(id);
      if (!terminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con ese ID"
        );
      }

      Object.keys(patchData).forEach((key) => {
        if (patchData[key] !== undefined) {
          terminal[key] = patchData[key];
        }
      });

      const updatedTerminal = await terminal.save();
      await updatedTerminal.populate("locker_id");

      return dataResponse("Terminal actualizada exitosamente", updatedTerminal);
    } catch (error) {
      return errorResponse(
        "Error al actualizar parcialmente la terminal",
        error.message
      );
    }
  }

  // UPDATE - Cambiar contraseña de terminal
  async changeTerminalPassword(id, newPassword) {
    try {
      const updatedTerminal = await TerminalModel.findByIdAndUpdate(
        id,
        { password: newPassword },
        { new: true, runValidators: true }
      ).populate("locker_id");

      if (!updatedTerminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con ese ID"
        );
      }
      return dataResponse(
        "Contraseña actualizada exitosamente",
        updatedTerminal
      );
    } catch (error) {
      return errorResponse("Error al cambiar la contraseña", error.message);
    }
  }

  // DELETE - Eliminar una terminal por ID
  async deleteTerminal(id) {
    try {
      const deletedTerminal = await TerminalModel.findByIdAndDelete(id);
      if (!deletedTerminal) {
        return errorResponse(
          "Terminal no encontrada",
          "No existe una terminal con ese ID"
        );
      }
      return dataResponse("Terminal eliminada exitosamente", deletedTerminal);
    } catch (error) {
      return errorResponse("Error al eliminar la terminal", error.message);
    }
  }

  // DELETE - Eliminar múltiples terminales
  async deleteMultipleTerminals(ids) {
    try {
      const result = await TerminalModel.deleteMany({ _id: { $in: ids } });
      return dataResponse(
        `${result.deletedCount} terminales eliminadas exitosamente`,
        { deletedCount: result.deletedCount }
      );
    } catch (error) {
      return errorResponse("Error al eliminar las terminales", error.message);
    }
  }

  // UTILITY - Verificar si existe una terminal por SN
  async existsBySerialNumber(sn) {
    try {
      const exists = await TerminalModel.exists({ sn });
      return dataResponse("Verificación completada", { exists: !!exists });
    } catch (error) {
      return errorResponse("Error al verificar existencia", error.message);
    }
  }

  // UTILITY - Verificar si existe una terminal por IP
  async existsByIP(ip) {
    try {
      const exists = await TerminalModel.exists({ ip });
      return dataResponse("Verificación completada", { exists: !!exists });
    } catch (error) {
      return errorResponse(
        "Error al verificar existencia por IP",
        error.message
      );
    }
  }

  // UTILITY - Contar total de terminales
  async countTerminals() {
    try {
      const count = await TerminalModel.countDocuments();
      return dataResponse("Conteo exitoso", { totalTerminals: count });
    } catch (error) {
      return errorResponse("Error al contar terminales", error.message);
    }
  }

  // UTILITY - Obtener terminales paginadas
  async getTerminalsPaginated(page = 1, limit = 10, filter = {}) {
    try {
      const skip = (page - 1) * limit;
      const terminals = await TerminalModel.find(filter)
        .populate("locker_id")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await TerminalModel.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      const paginationData = {
        terminals,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      return dataResponse(
        "Terminales paginadas obtenidas exitosamente",
        paginationData
      );
    } catch (error) {
      return errorResponse(
        "Error al obtener terminales paginadas",
        error.message
      );
    }
  }
}

module.exports = TerminalService;
