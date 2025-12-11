import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { env } from '../config/env';
import { logger } from '../logger/logger';

export interface EmailTemplateData {
  title?: string;
  header?: string;
  greeting?: string;
  mainMessage?: string;
  infoBox?: {
    title: string;
    items?: string[];
    content?: string;
    details?: Array<{ label: string; value: string }>;
  };
  additionalMessage?: string;
  buttonUrl?: string;
  buttonText?: string;
  messageBox?: string;
  warning?: string;
  linkInfo?: { label: string; url: string };
  conclusion?: string;
  signature?: string;
  logoBase64?: string;
}

export interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  templateData: EmailTemplateData;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
}

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const { host, port, secure, user, password } = env.email;
    if (!host || !user || !password) {
      throw new Error('SMTP configuration manquante (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
    });

    return this.transporter;
  }

  static async send(params: SendEmailParams): Promise<void> {
    logger.info(`📧 [MailService] Preparing to send email to ${params.to}, subject: "${params.subject}"`);
    
    try {
      const transporter = this.getTransporter();
      const emailConfig = env.email;

      const html = this.renderTemplate(params.templateData);
      const text = this.renderText(params.templateData);

      const attachments = params.attachments?.map((att) => {
        let content: string | Buffer = att.content;
        if (typeof att.content === 'string') {
          if (att.content.startsWith('data:')) {
            const base64 = att.content.split(',')[1] || att.content;
            content = Buffer.from(base64, 'base64');
          } else {
            content = Buffer.from(att.content, 'base64');
          }
        }
        return {
          filename: att.filename,
          content,
          contentType: att.contentType || 'application/octet-stream'
        };
      });

      logger.info(`📧 [MailService] Sending email via SMTP (${emailConfig.host}:${emailConfig.port})`);
      
      const result = await transporter.sendMail({
        from: `"${emailConfig.fromName}" <${emailConfig.user}>`,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html,
        text,
        attachments,
        headers: {
          'X-Mailer': 'Unlock Platform',
          'Reply-To': emailConfig.user,
        },
      });

      logger.info(`✅ [MailService] Email sent successfully to ${params.to}${params.cc ? ` (Cc: ${params.cc})` : ''} - MessageID: ${result.messageId}`);
    } catch (error) {
      logger.error(`❌ [MailService] Failed to send email to ${params.to}:`, error);
      throw error;
    }
  }

  private static renderTemplate(templateData: EmailTemplateData): string {
    const projectRoot = path.join(process.cwd(), 'dist');
    let templatePath = path.join(projectRoot, 'templates/email/base.hbs');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'src/templates/email/base.hbs');
    }

    const logoPath = path.join(process.cwd(), 'src/templates/email/assets/logo.png');
    if (fs.existsSync(logoPath)) {
      templateData.logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(source);

    const data = {
      title: templateData.title || 'Unlock',
      header: templateData.header || 'Notification',
      greeting: templateData.greeting,
      mainMessage: templateData.mainMessage,
      infoBox: templateData.infoBox,
      additionalMessage: templateData.additionalMessage,
      buttonUrl: templateData.buttonUrl,
      buttonText: templateData.buttonText || 'Accéder à la plateforme',
      messageBox: templateData.messageBox,
      warning: templateData.warning,
      linkInfo: templateData.linkInfo,
      conclusion: templateData.conclusion,
      signature: templateData.signature || "L'équipe Unlock",
      currentYear: new Date().getFullYear(),
      contactEmail: env.email.user,
      logoBase64: templateData.logoBase64 || '',
    };

    return template(data);
  }

  private static renderText(templateData: EmailTemplateData): string {
    const parts = [
      templateData.header,
      templateData.greeting,
      templateData.mainMessage,
      templateData.conclusion,
      templateData.signature,
    ].filter(Boolean) as string[];

    return parts.join('\n\n').replace(/<[^>]*>/g, '').trim();
  }
}

