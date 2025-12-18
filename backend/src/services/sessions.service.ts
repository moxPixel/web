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
      const sessionData = {
        ...data,
        seatsAvailable: data.seatsAvailable ?? data.seats,
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
        where.startDate = {};
        if (startDateFrom) {
          where.startDate[Op.gte] = new Date(startDateFrom);
        }
        if (startDateTo) {
          where.startDate[Op.lte] = new Date(startDateTo);
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

      await session.update(data, { transaction });
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

