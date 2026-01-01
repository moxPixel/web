import { Transaction, Op } from 'sequelize';
import TrainingEnrollment, { EnrollmentStatus, EnrollmentRole } from '../models/TrainingEnrollment';
import Training from '../models/Training';
import TrainingSession from '../models/TrainingSession';
import User, { UserRole, UserStatus } from '../models/User';
import { CreateEnrollmentDto, EnrollmentQueryParams, UpdateEnrollmentStatusDto } from '../types/enrollment.types';
import { hashPassword } from '../utils/password.util';
import { createError } from '../middleware/error.middleware';
import { sequelize } from '../database/sequelize';
import { logger } from '../logger/logger';
import { MailService } from './mail.service';
import env from '../config/env';

const ROLE_TO_USER_ROLE: Record<EnrollmentRole, UserRole> = {
  individual: UserRole.INDIVIDUAL,
  company: UserRole.COMPANY,
  trainer: UserRole.TRAINER,
  candidate: UserRole.CANDIDATE,
};

export class EnrollmentsService {
  private formatEnrollmentStatus(status: EnrollmentStatus): string {
    if (status === EnrollmentStatus.SUBMITTED) return 'Soumise';
    if (status === EnrollmentStatus.IN_REVIEW) return 'En revue';
    if (status === EnrollmentStatus.ACCEPTED) return 'Acceptée';
    if (status === EnrollmentStatus.REJECTED) return 'Non retenue';
    if (status === EnrollmentStatus.CANCELLED) return 'Annulée';
    return String(status);
  }

  private formatSessionLabel(session?: TrainingSession | null): string {
    if (!session?.startDate) return 'À planifier';
    const start = new Date(session.startDate);
    const end = session.endDate ? new Date(session.endDate) : null;
    const fmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const startLabel = Number.isNaN(start.getTime()) ? String(session.startDate) : start.toLocaleDateString('fr-FR', fmt);
    if (!end || Number.isNaN(end.getTime()) || end.getTime() === start.getTime()) return startLabel;
    return `Du ${startLabel} au ${end.toLocaleDateString('fr-FR', fmt)}`;
  }

  private buildStatusEmail(
    enrollment: TrainingEnrollment,
    training?: Training | null,
    session?: TrainingSession | null,
    adminNote?: string,
  ): { subject: string; templateData: any } {
    const trainingLabel = training?.shortTitle || training?.title || 'votre formation';
    const greetingName = `${enrollment.firstName || ''} ${enrollment.lastName || ''}`.trim();
    const greeting = greetingName ? `Bonjour ${greetingName},` : 'Bonjour,';
    const statusLabel = this.formatEnrollmentStatus(enrollment.status);

    const frontendBase = (env.allowedOrigins || 'http://localhost:4200').split(',')[0].replace(/\/$/, '');
    const profileUrl = `${frontendBase}/profile`;
    const trainingUrl = training?.slug ? `${frontendBase}/trainings/${training.slug}` : undefined;
    const orientationUrl = `${frontendBase}/orientation`;

    const infoDetails = [
      { label: 'Formation', value: trainingLabel },
      { label: 'Session', value: this.formatSessionLabel(session) },
      { label: 'Statut', value: statusLabel },
    ];

    const safeNote = (adminNote || '').trim();

    if (enrollment.status === EnrollmentStatus.ACCEPTED) {
      return {
        subject: `Félicitations — dossier accepté (${trainingLabel})`,
        templateData: {
          header: 'Votre dossier est accepté',
          greeting,
          mainMessage:
            `Excellente nouvelle : votre demande d'inscription pour « ${trainingLabel} » a été acceptée.\n` +
            `Votre compte est désormais prêt pour la suite (accès, échanges, suivi).`,
          infoBox: { title: 'Récapitulatif', details: infoDetails },
          ...(safeNote
            ? { messageBox: `Message de l’équipe:\n${safeNote}` }
            : {
                additionalMessage:
                  `Prochaines étapes :\n` +
                  `- Nous confirmons le format et la session (ou nous vous proposons un créneau)\n` +
                  `- Vous recevez les informations pratiques (accès, prérequis, organisation)\n` +
                  `- Nous restons disponibles pour le financement (OPCO/CPF/entreprise)`,
              }),
          buttonUrl: profileUrl,
          buttonText: 'Ouvrir mon espace',
          linkInfo: { label: 'Voir le détail de la formation', url: trainingUrl || orientationUrl },
          conclusion: 'Bienvenue chez Unlock — on s’occupe de la suite avec vous.',
          signature: "L'équipe Unlock",
        },
      };
    }

    if (enrollment.status === EnrollmentStatus.IN_REVIEW) {
      return {
        subject: `Votre dossier est en cours d’étude (${trainingLabel})`,
        templateData: {
          header: 'Votre demande est en cours d’étude',
          greeting,
          mainMessage:
            `Nous analysons actuellement votre demande d'inscription pour « ${trainingLabel} ».\n` +
            `Un conseiller peut vous contacter sous 24–48h pour confirmer vos objectifs, le format et la session.`,
          infoBox: { title: 'Récapitulatif', details: infoDetails },
          ...(safeNote ? { messageBox: `Info de l’équipe:\n${safeNote}` } : {}),
          buttonUrl: profileUrl,
          buttonText: 'Suivre ma demande',
          conclusion: 'Merci de votre patience — nous revenons vers vous très vite.',
          signature: "L'équipe Unlock",
        },
      };
    }

    if (enrollment.status === EnrollmentStatus.REJECTED) {
      return {
        subject: `Retour sur votre demande (${trainingLabel})`,
        templateData: {
          header: 'Retour sur votre demande',
          greeting,
          mainMessage:
            `Après étude, nous ne pouvons pas valider votre inscription à « ${trainingLabel} » à ce stade.\n` +
            `Cela ne remet pas en cause votre potentiel : nous voulons simplement garantir le bon niveau et le bon cadre pour votre réussite.`,
          infoBox: { title: 'Récapitulatif', details: infoDetails },
          ...(safeNote
            ? { messageBox: `Message de l’équipe:\n${safeNote}` }
            : {
                additionalMessage:
                  `Ce que nous vous proposons :\n` +
                  `- Faire le test d’orientation pour identifier le parcours le plus adapté\n` +
                  `- Nous contacter pour un échange rapide (objectif, contraintes, financement)\n` +
                  `- Refaire une demande dès que vous êtes prêt (nous vous guiderons)`,
              }),
          buttonUrl: orientationUrl,
          buttonText: 'Faire le test d’orientation',
          linkInfo: { label: 'Voir nos formations', url: `${frontendBase}/trainings` },
          conclusion: 'On reste à votre disposition pour construire un parcours qui vous correspond.',
          signature: "L'équipe Unlock",
        },
      };
    }

    if (enrollment.status === EnrollmentStatus.CANCELLED) {
      return {
        subject: `Votre demande a été annulée (${trainingLabel})`,
        templateData: {
          header: 'Demande annulée',
          greeting,
          mainMessage:
            `Votre demande d'inscription pour « ${trainingLabel} » a été marquée comme annulée.\n` +
            `Si c’est une erreur ou si votre projet évolue, vous pouvez refaire une demande à tout moment.`,
          infoBox: { title: 'Récapitulatif', details: infoDetails },
          ...(safeNote ? { messageBox: `Info de l’équipe:\n${safeNote}` } : {}),
          buttonUrl: `${frontendBase}/trainings`,
          buttonText: 'Voir les formations',
          conclusion: 'Merci — et à bientôt si vous souhaitez reprendre le projet.',
          signature: "L'équipe Unlock",
        },
      };
    }

    // SUBMITTED (or any fallback)
    return {
      subject: `Mise à jour de votre demande (${trainingLabel})`,
      templateData: {
        header: 'Mise à jour de votre demande',
        greeting,
        mainMessage:
          `Le statut de votre demande d'inscription pour « ${trainingLabel} » est maintenant : ${statusLabel}.`,
        infoBox: { title: 'Récapitulatif', details: infoDetails },
        ...(safeNote ? { messageBox: safeNote } : {}),
        buttonUrl: profileUrl,
        buttonText: 'Voir mon espace',
        conclusion: 'Merci de votre confiance.',
        signature: "L'équipe Unlock",
      },
    };
  }

  private async ensureTrainingAndSession(trainingId: string, sessionId?: string | null): Promise<void> {
    const training = await Training.findByPk(trainingId);
    if (!training) {
      throw createError('Formation introuvable', 404);
    }
    if (sessionId) {
      const session = await TrainingSession.findOne({ where: { id: sessionId, trainingId } });
      if (!session) {
        throw createError('Session introuvable pour cette formation', 404);
      }
    }
  }

  private async findOrCreateUser(
    email: string,
    role: EnrollmentRole,
    firstName: string,
    lastName: string,
    transaction: Transaction
  ): Promise<{ userId: string; existing: boolean; plainPassword?: string }> {
    const existing = await User.findOne({ where: { email: email.toLowerCase() }, transaction });
    if (existing) {
      logger.info(`User already exists for enrollment: ${email}`);
      return { userId: existing.id, existing: true };
    }

    logger.info(`Creating new user for enrollment: ${email}`);
    // Générer un mot de passe simple et lisible (8 caractères + symboles)
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // Sans 0, o, l, 1 pour éviter confusion
    const randomChars = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const randomPassword = `${randomChars.charAt(0).toUpperCase()}${randomChars.slice(1)}@${Math.floor(Math.random() * 99)}`;
    const hashed = await hashPassword(randomPassword);
    // Never log generated passwords or password hashes
    // ✅ POLITIQUE PENDING : Créer l'utilisateur avec status PENDING
    // L'utilisateur pourra se connecter immédiatement avec son mot de passe temporaire
    // Son compte sera automatiquement activé (PENDING -> ACTIVE) quand un admin accepte son enrollment
    const user = await User.create(
      {
        email: email.toLowerCase(),
        password: hashed,
        firstName,
        lastName,
        role: ROLE_TO_USER_ROLE[role],
        status: UserStatus.PENDING,
      },
      { transaction }
    );
    logger.info(`New user created with ID: ${user.id}, password will be sent`);
    return { userId: user.id, existing: false, plainPassword: randomPassword };
  }

  private async getAdminEmails(): Promise<string[]> {
    try {
      // Récupérer tous les utilisateurs avec le rôle admin depuis la base de données
      const admins = await User.findAll({
        where: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE, // Seulement les admins actifs
        },
        attributes: ['email'],
      });
      
      const adminEmails = admins.map((admin) => admin.email).filter(Boolean);
      logger.info(`[Enrollments] Found ${adminEmails.length} active admin(s) in database`);
      
      return adminEmails;
    } catch (error) {
      logger.error('[Enrollments] Failed to fetch admin emails:', error);
      // Fallback sur l'admin de l'env si la requête échoue
      const fallbackEmail = env.security.adminEmail;
      return fallbackEmail ? [fallbackEmail] : [];
    }
  }

  private async notifyCreation(enrollment: TrainingEnrollment, training: Training, session?: TrainingSession | null): Promise<void> {
    logger.info(`[Enrollments] notifyCreation - Starting email notifications for enrollment ${enrollment.id}`);
    
    const adminList = await this.getAdminEmails();
    const sessionLabel = session
      ? `${session.startDate ? session.startDate.toISOString().slice(0, 10) : ''}${session.endDate ? ' au ' + session.endDate.toISOString().slice(0, 10) : ''}`
      : 'Non précisée';

    const infoDetails = [
      { label: 'Formation', value: training.shortTitle || training.title || training.slug || training.id },
      { label: 'Session', value: sessionLabel },
      { label: 'Nom', value: `${enrollment.firstName} ${enrollment.lastName}`.trim() },
      { label: 'Email', value: enrollment.email },
      { label: 'Rôle', value: enrollment.role },
      { label: 'Statut', value: enrollment.status },
    ];

    const frontendBase = (env.allowedOrigins || 'http://localhost:4200').split(',')[0];

    const messageBoxParts: string[] = [];
    const msg = String((enrollment as any).message || '').trim();
    const objectives = String((enrollment as any).objectives || '').trim();
    if (msg) messageBoxParts.push(`Message / motivation :\n${msg}`);
    if (objectives) messageBoxParts.push(`Objectifs spécifiques :\n${objectives}`);
    const messageBox = messageBoxParts.length ? messageBoxParts.join('\n\n') : undefined;
    
    const userTemplate = {
      header: 'Confirmation de votre demande',
      greeting: `Bonjour ${enrollment.firstName || ''} ${enrollment.lastName || ''}`.trim(),
      mainMessage: `Nous avons bien reçu votre demande d'inscription pour la formation "${training.shortTitle || training.title}".`,
      infoBox: { title: 'Récapitulatif', details: infoDetails },
      ...(messageBox ? { messageBox } : {}),
      conclusion: 'Nous revenons vers vous rapidement pour valider votre inscription.',
      signature: "L'équipe Unlock",
      buttonUrl: training.slug ? `${frontendBase}/trainings/${training.slug}` : undefined,
      buttonText: 'Voir la formation',
    };

    const adminTemplate = {
      header: "Nouvelle demande d'inscription",
      greeting: 'Bonjour équipe,',
      mainMessage: `Une nouvelle demande d'inscription a été soumise pour "${training.shortTitle || training.title}".`,
      infoBox: { title: 'Détails', details: infoDetails },
      ...(messageBox ? { messageBox } : {}),
      conclusion: 'Merci de traiter la demande dans le backoffice.',
      signature: 'Système Unlock',
      buttonUrl: `${frontendBase.replace(/\/$/, '')}/backoffice/enrollments`,
      buttonText: 'Gérer les inscriptions',
    };

    // Email utilisateur
    if (enrollment.email) {
      logger.info(`[Enrollments] Sending user confirmation email to ${enrollment.email}`);
      await MailService.send({
        to: enrollment.email,
        subject: "Votre demande d'inscription a été reçue",
        templateData: userTemplate,
      });
      logger.info(`[Enrollments] User confirmation email sent to ${enrollment.email}`);
    }

    // Email admins - Envoyer à chaque admin individuellement
    if (adminList.length > 0) {
      logger.info(`[Enrollments] Sending admin notification to ${adminList.length} admin(s): ${adminList.join(', ')}`);
      
      for (const adminEmail of adminList) {
        try {
          await MailService.send({
            to: adminEmail,
            subject: "Nouvelle demande d'inscription",
            templateData: adminTemplate,
          });
          logger.info(`[Enrollments] Admin notification sent to ${adminEmail}`);
        } catch (error) {
          logger.error(`[Enrollments] Failed to send admin notification to ${adminEmail}:`, error);
        }
      }
    } else {
      logger.warn(`[Enrollments] No active admin users found in database, skipping admin notification`);
    }
  }

  private async notifyStatusChange(
    enrollment: TrainingEnrollment,
    training?: Training | null,
    session?: TrainingSession | null,
    adminNote?: string,
  ): Promise<void> {
    if (!enrollment.email) return;
    const { subject, templateData } = this.buildStatusEmail(enrollment, training, session, adminNote);
    await MailService.send({ to: enrollment.email, subject, templateData });
  }

  async create(data: CreateEnrollmentDto): Promise<TrainingEnrollment> {
    const transaction = await sequelize.transaction();
    try {
      await this.ensureTrainingAndSession(data.trainingId, data.sessionId || null);
      const { userId, existing, plainPassword } = await this.findOrCreateUser(
        data.email,
        data.role,
        data.firstName,
        data.lastName,
        transaction
      );

      // Empêcher un doublon pour le même email sur la même session/formation
      const existingEnrollment = await TrainingEnrollment.findOne({
        where: {
          trainingId: data.trainingId,
          sessionId: data.sessionId || null,
          email: data.email.toLowerCase(),
        },
        transaction,
      });
      if (existingEnrollment) {
        throw createError('Vous avez déjà une demande d\'inscription en cours pour cette session. Vous pouvez consulter vos demandes depuis votre espace personnel.', 409);
      }

      const enrollment = await TrainingEnrollment.create(
        {
          trainingId: data.trainingId,
          sessionId: data.sessionId || null,
          userId,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          siret: data.siret,
          teamSize: data.teamSize,
          message: data.message,
          preferredFormat: data.preferredFormat,
          desiredDate: data.desiredDate ? new Date(data.desiredDate) : null,
          objectives: data.objectives,
          status: EnrollmentStatus.SUBMITTED,
        },
        { transaction }
      );

      const training = await Training.findByPk(data.trainingId);
      const session = data.sessionId ? await TrainingSession.findByPk(data.sessionId) : null;

      await transaction.commit();
      
      // Notifications après commit - chaque email est indépendant
      logger.info(`[Enrollments] Transaction committed, sending notifications for ${data.email.toLowerCase()}`);
      logger.info(`[Enrollments] User was ${existing ? 'existing' : 'new'}`);
      
      // Email 1: Confirmation de demande (toujours envoyé)
      if (training) {
        try {
          logger.info(`[Enrollments] Sending enrollment confirmation email to ${data.email.toLowerCase()}`);
          await this.notifyCreation(enrollment, training, session || undefined);
          logger.info(`[Enrollments] ✅ Enrollment confirmation email sent`);
        } catch (err) {
          logger.error(`[Enrollments] ❌ Failed to send enrollment confirmation email:`, err);
        }
      }
      
      // Email 2: Mot de passe (uniquement si nouveau compte)
      if (!existing && plainPassword) {
        try {
          logger.info(`[Enrollments] Sending password email to ${data.email.toLowerCase()}`);
          await this.notifyUserPassword(data.email.toLowerCase(), plainPassword);
          logger.info(`[Enrollments] ✅ Password email sent successfully`);
        } catch (err) {
          logger.error(`[Enrollments] ❌ Failed to send password email:`, err);
        }
      } else {
        logger.info(`[Enrollments] Password email NOT sent - existing: ${existing}`);
      }

      // Attacher info existant pour le controller
      (enrollment as any).existingUser = existing;
      return enrollment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating enrollment:', error);
      throw error;
    }
  }

  private async notifyUserPassword(email: string, password: string): Promise<void> {
    if (!email || !password) {
      logger.warn(`[Enrollments] notifyUserPassword called with missing data - email: ${email ? 'YES' : 'NO'}, password: ${password ? 'YES' : 'NO'}`);
      return;
    }
    
    logger.info(`[Enrollments] notifyUserPassword - Sending credentials email to ${email}`);
    
    try {
      await MailService.send({
        to: email,
        subject: 'Votre accès Unlock',
        templateData: {
          header: 'Votre compte a été créé',
          greeting: 'Bonjour,',
          mainMessage: `Un compte a été créé pour vous lors de votre demande d'inscription.`,
          infoBox: {
            title: 'Vos identifiants de connexion',
            details: [
              { label: 'Email', value: email },
              { label: 'Mot de passe provisoire', value: password },
            ],
          },
          warning: '⚠️ Par sécurité, nous vous recommandons de changer ce mot de passe dès votre première connexion.',
          conclusion: 'Cliquez sur le bouton ci-dessous pour vous connecter.',
          signature: "L'équipe Unlock",
          buttonUrl: `${env.allowedOrigins.split(',')[0]}/login`,
          buttonText: 'Se connecter',
        },
      });
      logger.info(`[Enrollments] ✅ notifyUserPassword completed successfully for ${email}`);
    } catch (error) {
      logger.error(`[Enrollments] ❌ notifyUserPassword failed for ${email}:`, error);
      throw error;
    }
  }

  async findAll(query: EnrollmentQueryParams) {
    const {
      status,
      trainingId,
      sessionId,
      role,
      userId,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (status) where.status = status;
    if (trainingId) where.trainingId = trainingId;
    if (sessionId) where.sessionId = sessionId;
    if (role) where.role = role;
    if (userId) where.userId = userId;
    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 20));
    const safePage = Math.max(1, Number(page) || 1);
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await TrainingEnrollment.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Training, as: 'training', attributes: ['id', 'title', 'shortTitle', 'slug'] },
        { model: TrainingSession, as: 'session', attributes: ['id', 'startDate', 'endDate'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName', 'role'] },
      ],
    });

    return {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async updateStatus(id: string, data: UpdateEnrollmentStatusDto): Promise<TrainingEnrollment> {
    const enrollment = await TrainingEnrollment.findByPk(id);
    if (!enrollment) {
      throw createError('Inscription introuvable', 404);
    }
    enrollment.status = data.status;
    await enrollment.save();

    // ✅ POLITIQUE PENDING : Activation automatique du compte lors de l'acceptation
    // Si l'enrollment est acceptée et que l'utilisateur est encore PENDING, passer à ACTIVE
    // Cela permet à l'utilisateur d'avoir un compte pleinement fonctionnel après validation admin
    if (data.status === EnrollmentStatus.ACCEPTED && enrollment.userId) {
      try {
        const user = await User.findByPk(enrollment.userId);
        if (user && user.status === UserStatus.PENDING) {
          await user.update({ status: UserStatus.ACTIVE });
          logger.info(`[Enrollments] User ${user.id} (${user.email}) activated after enrollment acceptance`);
        }
      } catch (err) {
        logger.error('[Enrollments] Failed to activate user after enrollment acceptance:', err);
      }
    }

    // Notification statut
    try {
      const training = await Training.findByPk(enrollment.trainingId);
      const session = enrollment.sessionId ? await TrainingSession.findByPk(enrollment.sessionId) : null;
      await this.notifyStatusChange(enrollment, training || undefined, session || undefined, data.adminNote);
    } catch (err) {
      logger.error('Erreur envoi email statut inscription:', err);
    }

    return enrollment;
  }

  async findById(id: string): Promise<TrainingEnrollment> {
    const enrollment = await TrainingEnrollment.findByPk(id, {
      include: [
        { model: Training, as: 'training', attributes: ['id', 'title', 'shortTitle', 'slug'] },
        { model: TrainingSession, as: 'session', attributes: ['id', 'startDate', 'endDate', 'location'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName', 'role'] },
      ],
    });
    if (!enrollment) {
      throw createError('Inscription introuvable', 404);
    }
    return enrollment;
  }
}

export default new EnrollmentsService();

