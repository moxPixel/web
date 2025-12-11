import { Request, Response, NextFunction } from 'express';
import { Op, Transaction } from 'sequelize';
import User, { UserRole, UserStatus } from '../models/User';
import Individual from '../models/Individual';
import Company from '../models/Company';
import Trainer from '../models/Trainer';
import Candidate from '../models/Candidate';
import { UpdateUserStatusDto, UpdateUserDto, UserQueryParams } from '../types/auth.types';
import { ApiResponse, PaginatedResponse } from '../types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { sequelize } from '../database/sequelize';

export class UsersController {
  /**
   * POST /api/users
   * Créer un utilisateur (admin seulement)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, status } = req.body;

      if (!email || !password) {
        throw createError('Email et mot de passe sont requis', 400);
      }

      const transaction: Transaction = await sequelize.transaction();

      try {
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({
          where: { email: email.toLowerCase() },
          transaction,
        });

        if (existingUser) {
          await transaction.rollback();
          throw createError('Un compte avec cet email existe déjà', 409);
        }

        // Importer les utilitaires nécessaires
        const { hashPassword } = await import('../utils/password.util');
        const hashedPassword = await hashPassword(password);

        // Créer l'utilisateur
        const user = await User.create(
          {
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            role: role || UserRole.USER,
            status: status || UserStatus.PENDING,
            emailVerified: role === UserRole.ADMIN ? true : false, // Les admins sont automatiquement vérifiés
          },
          { transaction }
        );

        await transaction.commit();

        const userData = user.toJSON();
        delete (userData as { password?: string }).password;

        const response: ApiResponse = {
          success: true,
          data: userData,
          message: 'Utilisateur créé avec succès',
        };

        logger.info(`User created by admin ${req.user!.id}: ${user.id} (${user.email}) - Role: ${user.role}`);
        res.status(201).json(response);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Error creating user:', error);
      next(error);
    }
  }

  /**
   * GET /api/users
   * Liste des utilisateurs (admin seulement)
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as UserQueryParams;
      const pageNum = Number(query.page) || 1;
      const limitNum = Number(query.limit) || 20;
      const search = query.search;
      const status = query.status;
      const role = query.role;
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'DESC';

      const offset = (pageNum - 1) * limitNum;
      const whereClause: any = {};

      // Filtres
      if (search && search.trim()) {
        whereClause[Op.or] = [
          { email: { [Op.like]: `%${search.trim()}%` } },
          { firstName: { [Op.like]: `%${search.trim()}%` } },
          { lastName: { [Op.like]: `%${search.trim()}%` } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }
      if (role) {
        whereClause.role = role;
      }

      logger.info(`Fetching users with filters: ${JSON.stringify(whereClause)}`);

      let count: number;
      let rows: User[];

      try {
        const result = await User.findAndCountAll({
          where: Object.keys(whereClause).length > 0 ? whereClause : {},
          limit: limitNum,
          offset: offset,
          order: [[sortBy, sortOrder]],
          attributes: { exclude: ['password'] }, // Exclure le mot de passe
        });
        count = result.count;
        rows = result.rows;
      } catch (dbError) {
        logger.error('Error fetching users from database:', dbError);
        throw createError('Erreur lors de la récupération des utilisateurs', 500);
      }

      // Charger les profils pour chaque utilisateur
      const usersWithProfiles = await Promise.all(
        rows.map(async (user) => {
          try {
            const userData = user.toJSON();
            let profile = null;

            // Charger le profil seulement si nécessaire
            if (user.role !== UserRole.ADMIN && user.role !== UserRole.USER) {
              try {
                switch (user.role) {
                  case UserRole.INDIVIDUAL:
                    profile = await Individual.findOne({ where: { userId: user.id } });
                    break;
                  case UserRole.COMPANY:
                    profile = await Company.findOne({ where: { userId: user.id } });
                    break;
                  case UserRole.TRAINER:
                    profile = await Trainer.findOne({ where: { userId: user.id } });
                    break;
                  case UserRole.CANDIDATE:
                    profile = await Candidate.findOne({ where: { userId: user.id } });
                    break;
                }
              } catch (profileError) {
                logger.warn(`Error loading profile for user ${user.id}:`, profileError);
                // Continue même si le profil ne peut pas être chargé
              }
            }

            return {
              ...userData,
              profile: profile ? profile.toJSON() : null,
            };
          } catch (userError) {
            logger.error(`Error processing user ${user.id}:`, userError);
            // Retourner l'utilisateur sans profil en cas d'erreur
            return {
              ...user.toJSON(),
              profile: null,
            };
          }
        })
      );

      const response: PaginatedResponse<any> = {
        success: true,
        data: usersWithProfiles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in findAll users:', error);
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Détails d'un utilisateur (admin seulement)
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw createError(`User with id "${id}" not found`, 404);
      }

      // Charger le profil approprié
      let profile = null;
      switch (user.role) {
        case UserRole.INDIVIDUAL:
          profile = await Individual.findOne({ where: { userId: user.id } });
          break;
        case UserRole.COMPANY:
          profile = await Company.findOne({ where: { userId: user.id } });
          break;
        case UserRole.TRAINER:
          profile = await Trainer.findOne({ where: { userId: user.id } });
          break;
        case UserRole.CANDIDATE:
          profile = await Candidate.findOne({ where: { userId: user.id } });
          break;
      }

      const userData = user.toJSON();
      const response: ApiResponse = {
        success: true,
        data: {
          ...userData,
          profile: profile ? profile.toJSON() : null,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id/status
   * Mettre à jour le statut d'un utilisateur (admin seulement)
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateUserStatusDto = req.body;

      const transaction: Transaction = await sequelize.transaction();

      try {
        const user = await User.findByPk(id, { transaction });

        if (!user) {
          await transaction.rollback();
          throw createError(`User with id "${id}" not found`, 404);
        }

        await user.update({ status: data.status }, { transaction });
        await transaction.commit();

        const userData = user.toJSON();
        delete (userData as { password?: string }).password;

        const response: ApiResponse = {
          success: true,
          data: userData,
          message: `Statut de l'utilisateur mis à jour: ${data.status}`,
        };

        logger.info(`User ${id} status updated to ${data.status} by admin ${req.user!.id}`);
        res.status(200).json(response);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Mettre à jour un utilisateur
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateUserDto = req.body;
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const isOwnProfile = req.user!.id === id;

      // Seul l'admin ou le propriétaire peut modifier
      if (!isAdmin && !isOwnProfile) {
        throw createError('Accès non autorisé', 403);
      }

      const transaction: Transaction = await sequelize.transaction();

      try {
        const user = await User.findByPk(id, { transaction });

        if (!user) {
          await transaction.rollback();
          throw createError(`User with id "${id}" not found`, 404);
        }

        // Mettre à jour les champs de base de l'utilisateur
        const userUpdateData: Partial<User> = {};
        if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
        if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;

        if (Object.keys(userUpdateData).length > 0) {
          await user.update(userUpdateData, { transaction });
        }

        // Mettre à jour le profil approprié
        let profile = null;
        switch (user.role) {
          case UserRole.INDIVIDUAL:
            profile = await Individual.findOne({ where: { userId: user.id }, transaction });
            if (profile) {
              await profile.update(
                {
                  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                  phone: data.phone,
                  address: data.address,
                  city: data.city,
                  postalCode: data.postalCode,
                  country: data.country,
                },
                { transaction }
              );
            }
            break;

          case UserRole.COMPANY:
            profile = await Company.findOne({ where: { userId: user.id }, transaction });
            if (profile) {
              await profile.update(
                {
                  siret: data.siret,
                  companyName: data.companyName,
                  legalForm: data.legalForm,
                  website: data.website,
                  numberOfEmployees: data.numberOfEmployees,
                  address: data.address,
                  city: data.city,
                  postalCode: data.postalCode,
                  country: data.country,
                  phone: data.phone,
                },
                { transaction }
              );
            }
            break;

          case UserRole.TRAINER:
            profile = await Trainer.findOne({ where: { userId: user.id }, transaction });
            if (profile) {
              await profile.update(
                {
                  siret: data.trainerSiret,
                  specialties: data.specialties,
                  certifications: data.certifications,
                  yearsOfExperience: data.yearsOfExperience,
                  bio: data.bio,
                  phone: data.phone,
                  address: data.address,
                  city: data.city,
                  postalCode: data.postalCode,
                  country: data.country,
                },
                { transaction }
              );
            }
            break;

          case UserRole.CANDIDATE:
            profile = await Candidate.findOne({ where: { userId: user.id }, transaction });
            if (profile) {
              await profile.update(
                {
                  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                  educationLevel: data.educationLevel,
                  cv: data.cv,
                  coverLetter: data.coverLetter,
                  phone: data.phone,
                  address: data.address,
                  city: data.city,
                  postalCode: data.postalCode,
                  country: data.country,
                },
                { transaction }
              );
            }
            break;
        }

        await transaction.commit();

        const userData = user.toJSON();
        delete (userData as { password?: string }).password;

        const response: ApiResponse = {
          success: true,
          data: {
            ...userData,
            profile: profile ? profile.toJSON() : null,
          },
          message: 'Utilisateur mis à jour avec succès',
        };

        res.status(200).json(response);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Supprimer un utilisateur (admin seulement)
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        throw createError(`User with id "${id}" not found`, 404);
      }

      await user.destroy(); // Cascade delete will handle profiles

      const response: ApiResponse = {
        success: true,
        message: 'Utilisateur supprimé avec succès',
      };

      logger.info(`User ${id} deleted by admin ${req.user!.id}`);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
