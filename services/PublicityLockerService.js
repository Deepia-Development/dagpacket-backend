const PublicityModel = require('../models/PublicityModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

class PublicityLockerService {
  async createPublicity(req) {
    try {
      const { locker_id, enterprise, type, duration, income, description, images } = req.body;
      if (!locker_id || !enterprise || !type || !duration || !income || !description || !images) {
        return errorResponse('Faltan datos obligatorios');
      }
      const contract = req.file;
      console.log('contract', contract);

      if (!contract) {
        return res.status(400).json({ success: false, message: 'El archivo del contrato es requerido.' });
      }

      // para los anuncios digitales
      if (type === 'digital' && (duration < 20 || duration > 30)) {
        return errorResponse('La duración debe estar entre 20 y 30 segundos');
      }

      console.log('images', images);

      // Verificar si images es un array
      const processedImages = Array.isArray(images) ? images.map(img => ({
        url: img.url,
        alt: img.alt,
        image64: img.image64
      })) : [];

      const newAdvertisement = {
        enterprise,
        type,
        duration,
        income,
        description,
        images: processedImages,
        contract: contract ? {
          file64: contract.buffer ? contract.buffer.toString('base64') : '',
          url: `/uploads/contracts/${contract.filename}`
        } : null
      };

      // Buscar si ya existe publicidad para este locker
      let publicity = await PublicityModel.findOne({ locker_id });

      if (publicity) {
        // Añadir nuevo anuncio al array existente
        publicity.advertisements.push(newAdvertisement);
      } else {
        // Crear nuevo documento
        publicity = new PublicityModel({
          locker_id,
          advertisements: [newAdvertisement]
        });
      }

      await publicity.save();

      return successResponse('Publicidad creada correctamente');
    } catch (error) {
      console.error('Error en createPublicity service:', error);
      return errorResponse('Error al crear la publicidad: ' + error.message);
    }
  }

  async getPublicityByLocker(lockerId) {
    try {
      const publicity = await PublicityModel.findOne({ locker_id: lockerId });
      if (!publicity) {
        return dataResponse([], 'No se encontró publicidad para este locker');
      }
      return dataResponse(publicity, 'Publicidad recuperada correctamente');
    } catch (error) {
      console.error('Error en getPublicityByLocker service:', error);
      return errorResponse('Error al obtener la publicidad: ' + error.message);
    }
  }

   async getPublicityById(req) {
    try {
      console.log('req.params', req.params);
      const { id } = req.params;
      const publicity = await PublicityModel.findById(id);
      if (!publicity) {
        return null;
      }
      return publicity;
    } catch (error) {
      console.error('Error en getPublicityById service:', error);
      throw new Error('Error al recuperar la publicidad: ' + error.message);
    }
  }

  async updateAdvertisement(lockerId, advertisementId, updateData) {
    try {
      const result = await PublicityModel.findOneAndUpdate(
        { 
          'locker_id': lockerId,
          'advertisements._id': advertisementId 
        },
        { 
          $set: {
            'advertisements.$': { ...updateData }
          }
        },
        { new: true }
      );
      if (!result) {
        return errorResponse('No se encontró la publicidad especificada');
      }
      return successResponse('Publicidad actualizada correctamente');
    } catch (error) {
      console.error('Error en updateAdvertisement service:', error);
      return errorResponse('Error al actualizar la publicidad: ' + error.message);
    }
  }

  async deleteAdvertisement(lockerId, advertisementId) {
    try {
      const result = await PublicityModel.findOneAndUpdate(
        { locker_id: lockerId },
        { 
          $pull: { 
            advertisements: { _id: advertisementId }
          }
        },
        { new: true }
      );
      if (!result) {
        return errorResponse('No se encontró la publicidad especificada');
      }
      return successResponse('Publicidad eliminada correctamente');
    } catch (error) {
      console.error('Error en deleteAdvertisement service:', error);
      return errorResponse('Error al eliminar la publicidad: ' + error.message);
    }
  }
}

module.exports = new PublicityLockerService();