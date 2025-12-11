import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Contact, { ContactStatus, ContactType, RequestType, SubjectCategory } from '../models/Contact';
import User from '../models/User';
import { ApiResponse, PaginatedResponse } from '../types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';

export interface ContactQueryParams {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  contactType?: ContactType;
  requestType?: RequestType;
  search?: string;
}

export interface CreateContactDto {
  contactType: ContactType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  requestType: RequestType;
  subjectCategory: SubjectCategory;
  message: string;
  consent: boolean;
}

export interface UpdateContactDto {
  status?: ContactStatus;
  response?: string;
}

export class ContactsController {
  /**
   * POST /api/contacts
   * Créer une nouvelle demande de contact (public)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        contactType,
        firstName,
        lastName,
        companyName,
        email,
        phone,
        requestType,
        subjectCategory,
        message,
        consent,
      }: CreateContactDto = req.body;

      // Validation
      if (!contactType || !email || !requestType || !subjectCategory || !message) {
        throw createError('Les champs obligatoires sont manquants', 400);
      }

      if (!consent) {
        throw createError('Le consentement est requis', 400);
      }

      // Créer le contact
      const contact = await Contact.create({
        contactType,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        companyName: companyName || undefined,
        email: email.toLowerCase(),
        phone: phone || undefined,
        requestType,
        subjectCategory,
        message,
        consent,
        status: ContactStatus.PENDING,
      });

      logger.info(`✅ Contact créé: ${contact.id}`);

      const response: ApiResponse<Contact> = {
        success: true,
        data: contact,
        message: 'Demande de contact créée avec succès',
      };

      res.status(201).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/contacts
   * Lister toutes les demandes de contact (admin seulement)
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        contactType,
        requestType,
        search,
      }: ContactQueryParams = req.query as any;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Filtres
      if (status) {
        where.status = status;
      }
      if (contactType) {
        where.contactType = contactType;
      }
      if (requestType) {
        where.requestType = requestType;
      }
      if (search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { companyName: { [Op.like]: `%${search}%` } },
          { message: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Contact.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'email', 'firstName', 'lastName'],
            required: false,
          },
        ],
      });

      const response: PaginatedResponse<Contact> = {
        success: true,
        data: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/contacts/:id
   * Obtenir une demande de contact par ID (admin seulement)
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const contact = await Contact.findByPk(id, {
        include: [
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'email', 'firstName', 'lastName'],
            required: false,
          },
        ],
      });

      if (!contact) {
        throw createError('Demande de contact non trouvée', 404);
      }

      const response: ApiResponse<Contact> = {
        success: true,
        data: contact,
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/contacts/:id
   * Mettre à jour une demande de contact (admin seulement)
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, response }: UpdateContactDto = req.body;
      const userId = (req as any).user?.id;

      const contact = await Contact.findByPk(id);

      if (!contact) {
        throw createError('Demande de contact non trouvée', 404);
      }

      // Mettre à jour le statut
      if (status) {
        contact.status = status;
      }

      // Mettre à jour la réponse
      if (response !== undefined) {
        contact.response = response;
        if (response && !contact.respondedAt) {
          contact.respondedAt = new Date();
          contact.respondedBy = userId;
        }
      }

      await contact.save();

      // Recharger avec les associations
      await contact.reload({
        include: [
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'email', 'firstName', 'lastName'],
            required: false,
          },
        ],
      });

      logger.info(`✅ Contact mis à jour: ${contact.id}`);

      const apiResponse: ApiResponse<Contact> = {
        success: true,
        data: contact,
        message: 'Demande de contact mise à jour avec succès',
      };

      res.json(apiResponse);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/contacts/:id
   * Supprimer une demande de contact (admin seulement)
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const contact = await Contact.findByPk(id);

      if (!contact) {
        throw createError('Demande de contact non trouvée', 404);
      }

      await contact.destroy();

      logger.info(`✅ Contact supprimé: ${id}`);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Demande de contact supprimée avec succès',
      };

      res.json(response);
    } catch (error: any) {
      next(error);
    }
  }
}

export default new ContactsController();

