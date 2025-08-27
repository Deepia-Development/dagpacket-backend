const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');
const TerminalService = require('../services/TerminalService');

class TerminalController {
  
  // CREATE - Crear una nueva terminal
  static async createTerminal(req, res) {
    try {
      const { id, password, sn, locker_id, ip } = req.body;
      
      // Validaciones básicas
      if (!id || !password || !sn || !ip) {
        return res.status(400).json(errorResponse('Los campos id, password, sn e ip son requeridos'));
      }

      const terminalData = {
        id,
        password,
        sn,
        ip,
        ...(locker_id && { locker_id })
      };

      const terminalService = new TerminalService();
      const result = await terminalService.createTerminal(terminalData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in terminal creation:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // READ - Obtener todas las terminales
  static async getAllTerminals(req, res) {
    try {
      const terminalService = new TerminalService();
      const result = await terminalService.getAllTerminals();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error getting all terminals:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // READ - Obtener terminal por ID
  static async getTerminalById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json(errorResponse('ID de terminal es requerido'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.getTerminalById(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error getting terminal by ID:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // READ - Obtener terminal por número de serie
  static async getTerminalBySN(req, res) {
    try {
      const { sn } = req.params;
      
      if (!sn) {
        return res.status(400).json(errorResponse('Número de serie es requerido'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.getTerminalBySN(sn);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error getting terminal by SN:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // READ - Obtener terminal por IP
  static async getTerminalByIP(req, res) {
    try {
      const { ip } = req.params;
      
      if (!ip) {
        return res.status(400).json(errorResponse('Dirección IP es requerida'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.getTerminalByIP(ip);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error getting terminal by IP:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // READ - Obtener terminales por locker ID
  static async getTerminalsByLockerId(req, res) {
    try {
      const { lockerId } = req.params;
      
      if (!lockerId) {
        return res.status(400).json(errorResponse('ID del locker es requerido'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.getTerminalsByLockerId(lockerId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error getting terminals by locker ID:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // READ - Obtener terminales con paginación
  static async getTerminalsPaginated(req, res) {
    try {
      const { page = 1, limit = 10, ...filter } = req.query;
      
      const terminalService = new TerminalService();
      const result = await terminalService.getTerminalsPaginated(
        parseInt(page),
        parseInt(limit),
        filter
      );
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error getting paginated terminals:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // UPDATE - Actualizar terminal completa
  static async updateTerminal(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        return res.status(400).json(errorResponse('ID de terminal es requerido'));
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json(errorResponse('Datos para actualizar son requeridos'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.updateTerminal(id, updateData);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error updating terminal:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // UPDATE - Actualización parcial de terminal
  static async patchTerminal(req, res) {
    try {
      const { id } = req.params;
      const patchData = req.body;
      
      if (!id) {
        return res.status(400).json(errorResponse('ID de terminal es requerido'));
      }

      if (Object.keys(patchData).length === 0) {
        return res.status(400).json(errorResponse('Datos para actualizar son requeridos'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.patchTerminal(id, patchData);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error patching terminal:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // UPDATE - Cambiar contraseña de terminal
  static async changeTerminalPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!id) {
        return res.status(400).json(errorResponse('ID de terminal es requerido'));
      }

      if (!newPassword) {
        return res.status(400).json(errorResponse('Nueva contraseña es requerida'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.changeTerminalPassword(id, newPassword);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error changing terminal password:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // DELETE - Eliminar terminal por ID
  static async deleteTerminal(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json(errorResponse('ID de terminal es requerido'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.deleteTerminal(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message.includes('no encontrada')) {
          res.status(404).json(result);
        } else {
          res.status(400).json(result);
        }
      }
    } catch (error) {
      console.error('Error deleting terminal:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // DELETE - Eliminar múltiples terminales
  static async deleteMultipleTerminals(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(errorResponse('Array de IDs es requerido'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.deleteMultipleTerminals(ids);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error deleting multiple terminals:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // UTILITY - Verificar existencia por número de serie
  static async existsBySerialNumber(req, res) {
    try {
      const { sn } = req.params;
      
      if (!sn) {
        return res.status(400).json(errorResponse('Número de serie es requerido'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.existsBySerialNumber(sn);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error checking existence by SN:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // UTILITY - Verificar existencia por IP
  static async existsByIP(req, res) {
    try {
      const { ip } = req.params;
      
      if (!ip) {
        return res.status(400).json(errorResponse('Dirección IP es requerida'));
      }

      const terminalService = new TerminalService();
      const result = await terminalService.existsByIP(ip);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error checking existence by IP:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }

  // UTILITY - Contar total de terminales
  static async countTerminals(req, res) {
    try {
      const terminalService = new TerminalService();
      const result = await terminalService.countTerminals();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error counting terminals:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }
}

module.exports = TerminalController;