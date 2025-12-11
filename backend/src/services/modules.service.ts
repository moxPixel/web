import TrainingModule from '../models/TrainingModule';
import Training from '../models/Training';
import { CreateModuleDto, UpdateModuleDto } from '../types/module.types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';

export class ModulesService {
  /**
   * Créer un nouveau module
   */
  async create(data: CreateModuleDto): Promise<TrainingModule> {
    try {
      // Vérifier que la formation existe
      const training = await Training.findByPk(data.trainingId);
      if (!training) {
        throw createError(`Training with id "${data.trainingId}" not found`, 404);
      }

      // Si order n'est pas fourni, utiliser le prochain ordre disponible
      if (data.order === undefined) {
        const lastModule = await TrainingModule.findOne({
          where: { trainingId: data.trainingId },
          order: [['order', 'DESC']],
        });
        data.order = lastModule ? lastModule.order + 1 : 0;
      }

      const module = await TrainingModule.create(data);
      logger.info(`Module created: ${module.id}`);
      return module;
    } catch (error) {
      logger.error('Error creating module:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les modules d'une formation
   */
  async findByTrainingId(trainingId: string): Promise<TrainingModule[]> {
    try {
      const modules = await TrainingModule.findAll({
        where: { trainingId },
        order: [['order', 'ASC']],
      });

      return modules;
    } catch (error) {
      logger.error(`Error finding modules for training ${trainingId}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer un module par ID
   */
  async findById(id: string): Promise<TrainingModule> {
    try {
      const module = await TrainingModule.findByPk(id);

      if (!module) {
        throw createError(`Module with id "${id}" not found`, 404);
      }

      return module;
    } catch (error) {
      logger.error(`Error finding module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour un module
   */
  async update(id: string, data: UpdateModuleDto): Promise<TrainingModule> {
    try {
      const module = await this.findById(id);
      await module.update(data);
      await module.reload();

      logger.info(`Module updated: ${id}`);
      return module;
    } catch (error) {
      logger.error(`Error updating module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un module
   */
  async delete(id: string): Promise<void> {
    try {
      const module = await this.findById(id);
      await module.destroy();
      logger.info(`Module deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting module ${id}:`, error);
      throw error;
    }
  }
}

export default new ModulesService();

