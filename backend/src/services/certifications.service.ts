import { Op, Transaction } from 'sequelize';
import Certification from '../models/Certification';
import { CreateCertificationDto, UpdateCertificationDto, CertificationQueryParams } from '../types/certification.types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { sequelize } from '../database/sequelize';

export class CertificationsService {
  /**
   * Créer une nouvelle certification avec transaction
   */
  async create(data: CreateCertificationDto): Promise<Certification> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      // Vérifier si le code existe déjà
      const existing = await Certification.findOne({ 
        where: { code: data.code },
        transaction 
      });
      if (existing) {
        await transaction.rollback();
        throw createError(`Certification with code "${data.code}" already exists`, 409);
      }

      const certification = await Certification.create(data, { transaction });
      await transaction.commit();
      logger.info(`Certification created: ${certification.id}`);
      return certification;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating certification:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les certifications avec filtres et pagination
   */
  async findAll(query: CertificationQueryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;

      const offset = (page - 1) * limit;
      const where: Record<string, unknown> = {};

      // Filtres
      if (search) {
        where[Op.or as unknown as string] = [
          { title: { [Op.like as unknown as string]: `%${search}%` } },
          { code: { [Op.like as unknown as string]: `%${search}%` } },
          { type: { [Op.like as unknown as string]: `%${search}%` } },
        ];
      }

      if (status) where.status = status;

      const { count, rows } = await Certification.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
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
      logger.error('Error finding certifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer une certification par ID
   */
  async findById(id: string): Promise<Certification> {
    try {
      const certification = await Certification.findByPk(id);

      if (!certification) {
        throw createError(`Certification with id "${id}" not found`, 404);
      }

      return certification;
    } catch (error) {
      logger.error(`Error finding certification ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour une certification avec transaction
   */
  async update(id: string, data: UpdateCertificationDto): Promise<Certification> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const certification = await Certification.findByPk(id, { transaction });
      if (!certification) {
        await transaction.rollback();
        throw createError(`Certification with id "${id}" not found`, 404);
      }

      // Vérifier si le code est modifié et existe déjà
      if (data.code && data.code !== certification.code) {
        const existing = await Certification.findOne({ 
          where: { code: data.code },
          transaction 
        });
        if (existing && existing.id !== id) {
          await transaction.rollback();
          throw createError(`Certification with code "${data.code}" already exists`, 409);
        }
      }

      await certification.update(data, { transaction });
      await certification.reload({ transaction });
      await transaction.commit();

      logger.info(`Certification updated: ${id}`);
      return certification;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error updating certification ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer une certification
   */
  async delete(id: string): Promise<void> {
    try {
      const certification = await this.findById(id);
      await certification.destroy();
      logger.info(`Certification deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting certification ${id}:`, error);
      throw error;
    }
  }
}

export default new CertificationsService();

