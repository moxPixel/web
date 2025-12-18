import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Contact, { ContactStatus, ContactType, RequestType, SubjectCategory } from '../models/Contact';
import User, { UserRole, UserStatus } from '../models/User';
import { ApiResponse, PaginatedResponse } from '../types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { MailService } from '../services/mail.service';
import { env } from '../config/env';

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

      // Envoyer les emails de manière asynchrone (ne pas bloquer la réponse)
      this.sendContactEmails(contact).catch((err: any) => {
        logger.error(`❌ Erreur lors de l'envoi des emails pour le contact ${contact.id}:`, err);
      });

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

  /**
   * Envoyer les emails de notification pour un nouveau contact
   */
  private async sendContactEmails(contact: Contact): Promise<void> {
    // Email 1: confirmation utilisateur (ne doit PAS empêcher la notif admin)
    try {
      const userName = contact.firstName || contact.companyName || 'Madame, Monsieur';
      logger.info(`📧 [Contacts] Sending confirmation email to ${contact.email}`);

      await MailService.send({
        to: contact.email,
        subject: 'Votre demande de contact a été reçue',
        templateData: {
          header: 'Demande de contact reçue',
          greeting: `Bonjour ${userName},`,
          mainMessage: 'Nous avons bien reçu votre demande de contact et nous vous répondrons dans les plus brefs délais.',
          infoBox: {
            title: 'Résumé de votre demande',
            details: [
              { label: 'Type de contact', value: contact.contactType },
              { label: 'Type de demande', value: contact.requestType },
              { label: 'Catégorie', value: contact.subjectCategory },
              { label: 'Date', value: new Date(contact.createdAt).toLocaleDateString('fr-FR') },
            ],
          },
          messageBox: contact.message,
          conclusion: 'Merci de votre confiance. Nous vous contacterons prochainement.',
          signature: "L'équipe Unlock",
        },
      });

      logger.info(`✅ [Contacts] Confirmation email sent to ${contact.email}`);
    } catch (error) {
      logger.error(`❌ [Contacts] Failed to send confirmation email to ${contact.email}:`, error);
    }

    // Email 2: notification admin (fallback si aucun admin trouvé)
    try {
      // On notifie tous les admins (peu importe status) pour éviter de rater des demandes
      const admins = await User.findAll({
        where: { role: UserRole.ADMIN },
        attributes: ['email', 'firstName', 'lastName', 'status'],
      });

      const adminRecipients =
        admins.length > 0
          ? admins.map((a) => a.email).filter(Boolean)
          : [env.email.user].filter(Boolean);

      if (adminRecipients.length === 0) {
        logger.warn('⚠️ [Contacts] No admin recipients found (no admin users + env.email.user empty)');
        return;
      }

      logger.info(`📧 [Contacts] Sending notification email to admins: ${adminRecipients.join(', ')}`);

      const contactName =
        contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.companyName || contact.email;

      await MailService.send({
        to: adminRecipients.join(', '),
        subject: `Nouvelle demande de contact - ${contactName}`,
        templateData: {
          header: 'Nouvelle demande de contact',
          greeting: 'Bonjour,',
          mainMessage: `Une nouvelle demande de contact a été reçue sur la plateforme Unlock.`,
          infoBox: {
            title: 'Détails de la demande',
            details: [
              { label: 'Nom', value: contactName },
              { label: 'Email', value: contact.email },
              { label: 'Téléphone', value: contact.phone || 'Non renseigné' },
              { label: 'Type de contact', value: contact.contactType },
              { label: 'Type de demande', value: contact.requestType },
              { label: 'Catégorie', value: contact.subjectCategory },
              {
                label: 'Date',
                value: new Date(contact.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ],
          },
          messageBox: contact.message,
          buttonUrl: `${env.allowedOrigins.split(',')[0]}/bo/contacts`,
          buttonText: 'Voir la demande',
          conclusion: 'Merci de traiter cette demande dans les plus brefs délais.',
          signature: 'Système de notification Unlock',
        },
      });

      logger.info(`✅ [Contacts] Notification email sent (${adminRecipients.length} recipient(s))`);
    } catch (error) {
      logger.error('❌ [Contacts] Failed to send admin notification email:', error);
    }
  }
}

export default new ContactsController();

