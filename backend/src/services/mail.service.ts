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

  private static escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static textToSafeHtml(input: string): string {
    // Escape everything, then reintroduce line breaks.
    return this.escapeHtml(input).replace(/\r\n|\n|\r/g, '<br/>');
  }

  private static normalizeTemplateData(templateData: EmailTemplateData): EmailTemplateData {
    const safe: EmailTemplateData = { ...templateData };

    if (safe.greeting) safe.greeting = this.textToSafeHtml(String(safe.greeting));
    if (safe.mainMessage) safe.mainMessage = this.textToSafeHtml(String(safe.mainMessage));
    if (safe.additionalMessage) safe.additionalMessage = this.textToSafeHtml(String(safe.additionalMessage));
    if (safe.messageBox) safe.messageBox = this.textToSafeHtml(String(safe.messageBox));
    if (safe.warning) safe.warning = this.textToSafeHtml(String(safe.warning));
    if (safe.conclusion) safe.conclusion = this.textToSafeHtml(String(safe.conclusion));

    if (safe.infoBox) {
      safe.infoBox = {
        title: this.escapeHtml(String(safe.infoBox.title || '')),
        items: Array.isArray(safe.infoBox.items)
          ? safe.infoBox.items.map((i) => this.escapeHtml(String(i)))
          : undefined,
        content: safe.infoBox.content ? this.textToSafeHtml(String(safe.infoBox.content)) : undefined,
        details: Array.isArray(safe.infoBox.details)
          ? safe.infoBox.details.map((d) => ({
              label: this.escapeHtml(String(d.label)),
              value: this.escapeHtml(String(d.value)),
            }))
          : undefined,
      };
    }

    if (safe.linkInfo) {
      safe.linkInfo = {
        label: this.escapeHtml(String(safe.linkInfo.label)),
        url: String(safe.linkInfo.url),
      };
    }

    // Never allow HTML in these; keep plain.
    if (safe.header) safe.header = this.escapeHtml(String(safe.header));
    if (safe.signature) safe.signature = this.escapeHtml(String(safe.signature));

    return safe;
  }

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
      // Improve reliability: avoid hanging requests
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    });

    // Non-blocking verify (helps detect misconfig early, but won't break runtime if SMTP is temporarily down)
    this.transporter
      .verify()
      .then(() => logger.info('✅ [MailService] SMTP transporter verified'))
      .catch((err) => logger.warn('⚠️ [MailService] SMTP transporter verify failed', err));

    return this.transporter;
  }

  static async send(params: SendEmailParams): Promise<void> {
    logger.info(`📧 [MailService] Preparing to send email to ${params.to}, subject: "${params.subject}"`);
    
    try {
      const transporter = this.getTransporter();
      const emailConfig = env.email;

      const normalizedTemplateData = this.normalizeTemplateData(params.templateData);
      const html = this.renderTemplate(normalizedTemplateData);
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
      // Reset transporter so next attempt recreates a fresh connection
      this.transporter = null;
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
    const parts: string[] = [];

    if (templateData.header) {
      parts.push(templateData.header);
    }

    if (templateData.greeting) {
      parts.push(templateData.greeting.replace(/<[^>]*>/g, ''));
    }

    if (templateData.mainMessage) {
      parts.push(templateData.mainMessage.replace(/<[^>]*>/g, ''));
    }

    if (templateData.infoBox) {
      if (templateData.infoBox.title) {
        parts.push(`\n${templateData.infoBox.title}`);
      }
      if (templateData.infoBox.items) {
        parts.push(templateData.infoBox.items.map(item => `• ${item}`).join('\n'));
      }
      if (templateData.infoBox.content) {
        parts.push(templateData.infoBox.content);
      }
      if (templateData.infoBox.details) {
        parts.push(templateData.infoBox.details.map(d => `${d.label}: ${d.value}`).join('\n'));
      }
    }

    if (templateData.additionalMessage) {
      parts.push(templateData.additionalMessage.replace(/<[^>]*>/g, ''));
    }

    if (templateData.buttonUrl && templateData.buttonText) {
      parts.push(`\n${templateData.buttonText}: ${templateData.buttonUrl}`);
    }

    if (templateData.messageBox) {
      parts.push(templateData.messageBox.replace(/<[^>]*>/g, ''));
    }

    if (templateData.warning) {
      parts.push(`⚠️ Important : ${templateData.warning}`);
    }

    if (templateData.linkInfo) {
      parts.push(`${templateData.linkInfo.label}: ${templateData.linkInfo.url}`);
    }

    if (templateData.conclusion) {
      parts.push(templateData.conclusion.replace(/<[^>]*>/g, ''));
    }

    if (templateData.signature) {
      parts.push(`\n${templateData.signature}`);
    }

    return parts.join('\n\n').trim();
  }
}

