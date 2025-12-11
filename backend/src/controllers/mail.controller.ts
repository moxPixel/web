import { Request, Response, NextFunction } from 'express';
import { MailService } from '../services/mail.service';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';

export class MailController {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { to, cc, subject, message, attachments } = req.body || {};

      if (!to || !subject || !message) {
        throw createError('Champs requis: to, subject, message', 400);
      }

      await MailService.send({
        to,
        cc,
        subject,
        templateData: {
          header: subject,
          greeting: 'Bonjour,',
          mainMessage: message,
          conclusion: 'Merci de votre confiance.',
          signature: "L’équipe Unlock",
        },
        attachments: Array.isArray(attachments)
          ? attachments.map((att: any) => ({
              filename: att.filename,
              content: att.content,
              contentType: att.contentType,
            }))
          : undefined,
      });

      logger.info(`Mail envoyé à ${to}`);

      res.json({ success: true, message: 'Email envoyé' });
    } catch (error) {
      next(error);
    }
  }
}

export default new MailController();

