import { Op, Transaction } from 'sequelize';
import TrainingSession from '../models/TrainingSession';
import Training from '../models/Training';
import { CreateSessionDto, UpdateSessionDto, SessionQueryParams } from '../types/session.types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { sequelize } from '../database/sequelize';

export class SessionsService {
  /**
   * Créer une nouvelle session avec transaction
   */
  async create(data: CreateSessionDto): Promise<TrainingSession> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      // Vérifier que la formation existe
      const training = await Training.findByPk(data.trainingId, { transaction });
      if (!training) {
        await transaction.rollback();
        throw createError(`Training with id "${data.trainingId}" not found`, 404);
      }

      // Vérifier les dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate <= startDate) {
        await transaction.rollback();
        throw createError('End date must be after start date', 400);
      }

      // Si seatsAvailable n'est pas fourni, utiliser seats
      const sessionData: any = {
        ...data,
        seatsAvailable: data.seatsAvailable ?? data.seats ?? undefined,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };

      const session = await TrainingSession.create(sessionData, { transaction });
      await transaction.commit();
      
      // Recharger avec la relation training
      await session.reload({
        include: [
          {
            model: Training,
            as: 'training',
            required: false,
          },
        ],
      });
      
      logger.info(`Session created: ${session.id}`);
      return session;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les sessions avec filtres et pagination
   */
  async findAll(query: SessionQueryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        trainingId,
        status,
        highlight,
        startDateFrom,
        startDateTo,
        sortBy = 'startDate',
        sortOrder = 'ASC',
      } = query;

      const offset = (page - 1) * limit;
      const where: Record<string, unknown> = {};

      // Filtres
      if (trainingId) where.trainingId = trainingId;
      if (status) where.status = status;
      if (highlight !== undefined) where.highlight = highlight;

      if (startDateFrom || startDateTo) {
        (where as any).startDate = {};
        if (startDateFrom) {
          (where as any).startDate[Op.gte as unknown as string] = new Date(startDateFrom);
        }
        if (startDateTo) {
          (where as any).startDate[Op.lte as unknown as string] = new Date(startDateTo);
        }
      }

      const { count, rows } = await TrainingSession.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: Training,
            as: 'training',
            required: false,
          },
        ],
      });

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding sessions:', error);
      throw error;
    }
  }

  /**
   * Récupérer une session par ID
   */
  async findById(id: string): Promise<TrainingSession> {
    try {
      const session = await TrainingSession.findByPk(id, {
        include: [
          {
            model: Training,
            as: 'training',
            required: false,
          },
        ],
      });

      if (!session) {
        throw createError(`Session with id "${id}" not found`, 404);
      }

      return session;
    } catch (error) {
      logger.error(`Error finding session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour une session
   */
  async update(id: string, data: UpdateSessionDto): Promise<TrainingSession> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const session = await TrainingSession.findByPk(id, {
        include: [
          {
            model: Training,
            as: 'training',
            required: false,
          },
        ],
        transaction,
      });

      if (!session) {
        await transaction.rollback();
        throw createError(`Session with id "${id}" not found`, 404);
      }

      // Vérifier les dates si modifiées
      if (data.startDate || data.endDate) {
        const startDate = new Date(data.startDate || session.startDate);
        const endDate = new Date(data.endDate || session.endDate);

        if (endDate <= startDate) {
          await transaction.rollback();
          throw createError('End date must be after start date', 400);
        }
      }

      // Convertir les dates en objets Date si elles sont des strings
      const updateData: any = { ...data };
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }

      await session.update(updateData, { transaction });
      await session.reload({
        include: [
          {
            model: Training,
            as: 'training',
            required: false,
          },
        ],
        transaction,
      });

      await transaction.commit();
      logger.info(`Session updated: ${id}`);
      return session;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error updating session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer une session
   */
  async delete(id: string): Promise<void> {
    try {
      const session = await this.findById(id);
      await session.destroy();
      logger.info(`Session deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting session ${id}:`, error);
      throw error;
    }
  }
}

export default new SessionsService();

