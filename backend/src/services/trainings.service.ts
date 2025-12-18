import { Op, Transaction } from 'sequelize';
import Training from '../models/Training';
import TrainingModule from '../models/TrainingModule';
import TrainingSession from '../models/TrainingSession';
import { CreateTrainingDto, UpdateTrainingDto, TrainingQueryParams } from '../types/training.types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { sequelize } from '../database/sequelize';
import { deleteImage } from '../middleware/upload.middleware';
import path from 'path';

export class TrainingsService {
  /**
   * Créer une nouvelle formation avec transaction
   */
  async create(data: CreateTrainingDto): Promise<Training> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      // Vérifier si le slug existe déjà
      const existing = await Training.findOne({ 
        where: { slug: data.slug },
        transaction 
      });
      if (existing) {
        await transaction.rollback();
        throw createError(`Training with slug "${data.slug}" already exists`, 409);
      }

      const training = await Training.create(data, { transaction });
      
      // Si des modules sont fournis, les créer dans la même transaction
      if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        await TrainingModule.bulkCreate(
          data.modules.map((module, index) => ({
            ...module,
            trainingId: training.id,
            order: module.order ?? index,
          })),
          { transaction }
        );
      }

      await transaction.commit();
      logger.info(`Training created: ${training.id}`);
      
      // Recharger avec les relations pour retourner les données complètes
      await training.reload({
        include: [
          {
            model: TrainingModule,
            as: 'modules',
            required: false,
            order: [['order', 'ASC']],
          },
        ],
      });
      
      return training;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating training:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les formations avec filtres et pagination
   */
  async findAll(query: TrainingQueryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        level,
        trainingType,
        audienceType,
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;

      // Sécuriser les valeurs numériques (évite LIMIT '100' qui casse MySQL)
      const safeLimit = Math.max(1, Math.min(500, Number(limit) || 10));
      const safePage = Math.max(1, Number(page) || 1);
      const offset = (safePage - 1) * safeLimit;
      const where: Record<string, unknown> = {};

      // Filtres
      if (search) {
        where[Op.or as unknown as string] = [
          { title: { [Op.like as unknown as string]: `%${search}%` } },
          { shortTitle: { [Op.like as unknown as string]: `%${search}%` } },
          { slug: { [Op.like as unknown as string]: `%${search}%` } },
        ];
      }

      if (level) where.level = level;
      if (trainingType) where.trainingType = trainingType;
      if (audienceType) where.audienceType = audienceType;
      if (status) where.status = status;

      const { count, rows } = await Training.findAndCountAll({
        where,
        limit: safeLimit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: TrainingModule,
            as: 'modules',
            required: false,
          },
          {
            model: TrainingSession,
            as: 'sessions',
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
      logger.error('Error finding trainings:', error);
      throw error;
    }
  }

  /**
   * Récupérer une formation par ID
   */
  async findById(id: string): Promise<Training> {
    try {
      const training = await Training.findByPk(id, {
        include: [
          {
            model: TrainingModule,
            as: 'modules',
            required: false,
            order: [['order', 'ASC']],
          },
          {
            model: TrainingSession,
            as: 'sessions',
            required: false,
            order: [['startDate', 'ASC']],
          },
        ],
      });

      if (!training) {
        throw createError(`Training with id "${id}" not found`, 404);
      }

      return training;
    } catch (error) {
      logger.error(`Error finding training ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer une formation par slug
   */
  async findBySlug(slug: string): Promise<Training> {
    try {
      const training = await Training.findOne({
        where: { slug, status: 'published' },
        include: [
          {
            model: TrainingModule,
            as: 'modules',
            required: false,
            order: [['order', 'ASC']],
          },
          {
            model: TrainingSession,
            as: 'sessions',
            required: false,
            order: [['startDate', 'ASC']],
          },
        ],
      });

      if (!training) {
        throw createError(`Training with slug "${slug}" not found`, 404);
      }

      return training;
    } catch (error) {
      logger.error(`Error finding training by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour une formation avec transaction
   */
  async update(id: string, data: UpdateTrainingDto): Promise<Training> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const training = await Training.findByPk(id, {
        include: [
          {
            model: TrainingModule,
            as: 'modules',
            required: false,
          },
        ],
        transaction,
      });

      if (!training) {
        await transaction.rollback();
        throw createError(`Training with id "${id}" not found`, 404);
      }

      // Vérifier si le slug est modifié et existe déjà
      if (data.slug && data.slug !== training.slug) {
        const existing = await Training.findOne({ 
          where: { slug: data.slug },
          transaction 
        });
        if (existing && existing.id !== id) {
          await transaction.rollback();
          throw createError(`Training with slug "${data.slug}" already exists`, 409);
        }
      }

      // Supprimer les anciennes images si elles sont modifiées ou supprimées
      const oldHeroImage = training.heroImage;
      const oldWatermarkLogo = training.watermarkLogo;
      
      // Si une nouvelle image hero est fournie ou si l'image est supprimée (chaîne vide)
      if (data.heroImage !== undefined) {
        if (data.heroImage !== oldHeroImage && oldHeroImage) {
          const oldFilename = this.extractFilenameFromUrl(oldHeroImage);
          if (oldFilename) {
            try {
              deleteImage(oldFilename);
              logger.info(`Deleted old hero image: ${oldFilename}`);
            } catch (error) {
              logger.warn(`Failed to delete old hero image ${oldFilename}:`, error);
            }
          }
        }
      }
      
      // Si un nouveau watermark logo est fourni ou si le logo est supprimé (chaîne vide)
      if (data.watermarkLogo !== undefined) {
        if (data.watermarkLogo !== oldWatermarkLogo && oldWatermarkLogo) {
          const oldFilename = this.extractFilenameFromUrl(oldWatermarkLogo);
          if (oldFilename) {
            try {
              deleteImage(oldFilename);
              logger.info(`Deleted old watermark logo: ${oldFilename}`);
            } catch (error) {
              logger.warn(`Failed to delete old watermark logo ${oldFilename}:`, error);
            }
          }
        }
      }

      // Mettre à jour uniquement les champs fournis
      await training.update(data, { transaction });
      
      // Si des modules sont fournis, les mettre à jour
      if (data.modules && Array.isArray(data.modules)) {
        // Supprimer les anciens modules
        await TrainingModule.destroy({
          where: { trainingId: id },
          transaction,
        });
        
        // Créer les nouveaux modules
        if (data.modules.length > 0) {
          await TrainingModule.bulkCreate(
            data.modules.map((module, index) => ({
              ...module,
              trainingId: id,
              order: module.order ?? index,
            })),
            { transaction }
          );
        }
      }
      
      await transaction.commit();
      
      // Recharger avec les relations pour retourner les données complètes
      await training.reload({
        include: [
          {
            model: TrainingModule,
            as: 'modules',
            required: false,
            order: [['order', 'ASC']],
          },
          {
            model: TrainingSession,
            as: 'sessions',
            required: false,
            order: [['startDate', 'ASC']],
          },
        ],
      });

      logger.info(`Training updated: ${id}`);
      return training;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error updating training ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer une formation
   */
  async delete(id: string): Promise<void> {
    try {
      const training = await this.findById(id);
      
      // Supprimer les fichiers d'images associés
      this.deleteTrainingImages(training.heroImage, training.watermarkLogo);
      
      await training.destroy();
      logger.info(`Training deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting training ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer les fichiers d'images d'une formation
   */
  private deleteTrainingImages(heroImage?: string | null, watermarkLogo?: string | null): void {
    if (heroImage) {
      const heroFilename = this.extractFilenameFromUrl(heroImage);
      if (heroFilename) {
        try {
          deleteImage(heroFilename);
          logger.info(`Deleted hero image: ${heroFilename}`);
        } catch (error) {
          logger.warn(`Failed to delete hero image ${heroFilename}:`, error);
        }
      }
    }

    if (watermarkLogo) {
      const watermarkFilename = this.extractFilenameFromUrl(watermarkLogo);
      if (watermarkFilename) {
        try {
          deleteImage(watermarkFilename);
          logger.info(`Deleted watermark logo: ${watermarkFilename}`);
        } catch (error) {
          logger.warn(`Failed to delete watermark logo ${watermarkFilename}:`, error);
        }
      }
    }
  }

  /**
   * Extraire le nom de fichier depuis une URL d'image
   */
  private extractFilenameFromUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;
    
    try {
      let urlPath: string;
      
      // Si c'est une URL complète (http:// ou https://)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const url = new URL(imageUrl);
        urlPath = url.pathname;
      } else {
        // Si c'est un chemin relatif comme /uploads/images/filename.jpg
        urlPath = imageUrl;
      }
      
      // Vérifier que c'est bien un fichier dans /uploads/images/
      if (urlPath.includes('/uploads/images/')) {
        const filename = path.basename(urlPath);
        // Vérifier que le nom de fichier n'est pas vide et contient une extension
        if (filename && path.extname(filename)) {
          return filename;
        }
      }
      
      return null;
    } catch (error) {
      // Si ce n'est pas une URL valide, essayer d'extraire directement le nom de fichier
      if (imageUrl.includes('/uploads/images/')) {
        const filename = path.basename(imageUrl);
        if (filename && path.extname(filename)) {
          return filename;
        }
      }
      return null;
    }
  }
}

export default new TrainingsService();

