import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import config from '../config/app.config.js';

function buildTransport() {
  const host = config.email.smtp.host;
  const port = config.email.smtp.port;
  const user = config.email.smtp.user;
  const pass = config.email.smtp.pass;
  if (!host || !user || !pass) {
    logger.warn('[EmailService] SMTP is not fully configured. Emails will be skipped.');
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

class EmailService {
  constructor() {
    this.transporter = buildTransport();
    this.from = config.email.from;
  }

  async send({ to, subject, text, html }) {
    if (!this.transporter) {
      logger.info(`[EmailService] Skipping email to ${to}: ${subject}`);
      return { skipped: true };
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });
      logger.info('[EmailService] Email sent:', info.messageId);
      return { messageId: info.messageId };
    } catch (err) {
      logger.error('[EmailService] Failed to send email:', err.message);
      throw err;
    }
  }
}

export default new EmailService();


