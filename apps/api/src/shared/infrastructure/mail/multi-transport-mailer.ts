import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import nodemailer from 'nodemailer';
import { AppMailer, MailMessage, MailSendResult } from '../../domain/mailer';

function parseSender(rawFrom: string): { email: string; name?: string } {
  const match = rawFrom.trim().match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, '').trim() || undefined,
      email: match[2].trim(),
    };
  }
  return { email: rawFrom.trim() };
}

@Injectable()
export class MultiTransportMailer extends AppMailer {
  private readonly logger = new Logger(MultiTransportMailer.name);
  private readonly mxCache = new Map<string, { ok: boolean; expiresAt: number }>();

  private async canDeliverDomain(email: string): Promise<boolean> {
    const at = email.lastIndexOf('@');
    if (at <= 0) return false;
    const domain = email.slice(at + 1).trim().toLowerCase();
    if (!domain || !domain.includes('.')) return false;

    const cached = this.mxCache.get(domain);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.ok;
    }

    const remember = (ok: boolean) => {
      this.mxCache.set(domain, { ok, expiresAt: Date.now() + 10 * 60 * 1000 });
      return ok;
    };

    try {
      const mx = await Promise.race([
        dns.resolveMx(domain),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 2500)),
      ]);
      if (mx === null) {
        return true; // Timeout DNS temporal: no bloquear entrega
      }
      if (mx.length > 0) {
        return remember(true);
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'ENOTFOUND' || code === 'NXDOMAIN') {
        return remember(false);
      }
      if (code !== 'ENODATA') {
        return true;
      }
    }

    try {
      const addrs = await Promise.race([
        dns.resolve4(domain),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 2000)),
      ]);
      if (addrs === null) return true;
      return remember(addrs.length > 0);
    } catch {
      return remember(false);
    }
  }

  private mode(): 'disabled' | 'log' | 'brevo' | 'smtp' | 'auto' {
    const raw = (process.env.MAIL_MAILER || 'auto').trim().toLowerCase();
    if (raw === 'disabled' || raw === 'off' || raw === 'none') return 'disabled';
    if (raw === 'log') return 'log';
    if (raw === 'brevo') return 'brevo';
    if (raw === 'smtp') return 'smtp';
    return 'auto';
  }

  private hasSmtp(): boolean {
    return Boolean(
      process.env.SMTP_HOST?.trim() &&
        process.env.SMTP_USER?.trim() &&
        process.env.SMTP_PASSWORD?.trim() &&
        (process.env.SMTP_FROM?.trim() || process.env.MAIL_FROM_ADDRESS?.trim()),
    );
  }

  private hasBrevo(): boolean {
    return Boolean(
      process.env.BREVO_API_KEY?.trim() &&
        (process.env.SMTP_FROM?.trim() || process.env.MAIL_FROM_ADDRESS?.trim()),
    );
  }

  private resolveFrom(): string {
    return (
      process.env.SMTP_FROM?.trim() ||
      process.env.MAIL_FROM_ADDRESS?.trim() ||
      process.env.SMTP_USER?.trim() ||
      ''
    );
  }

  isConfigured(): boolean {
    const mode = this.mode();
    if (mode === 'disabled') return false;
    if (mode === 'log') return true;
    if (mode === 'brevo') return this.hasBrevo();
    if (mode === 'smtp') return this.hasSmtp();
    return this.hasSmtp() || this.hasBrevo();
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const recipients = [...new Set(message.to.map(x => x.trim()).filter(Boolean))];
    if (!recipients.length) {
      throw new Error('No existen destinatarios válidos para el envío del correo.');
    }

    const mode = this.mode();
    if (mode === 'disabled') {
      throw new Error('El envío de correos está deshabilitado (MAIL_MAILER=disabled).');
    }

    if (mode === 'log') {
      this.logger.log(`[MAIL_MAILER=log] To=${recipients.join(', ')} Subject="${message.subject}"`);
      return { provider: 'log', messageId: `log-${Date.now()}` };
    }

    const deliverable: string[] = [];
    for (const email of recipients) {
      if (await this.canDeliverDomain(email)) {
        deliverable.push(email);
      } else {
        this.logger.warn(`Correo omitido por dominio sin registros MX válidos: ${email}`);
      }
    }
    if (!deliverable.length) {
      throw new Error('Ningún destinatario tiene un dominio de correo válido.');
    }

    if (mode === 'brevo' || (mode === 'auto' && !this.hasSmtp() && this.hasBrevo())) {
      return this.sendViaBrevo(deliverable, message);
    }

    if (this.hasSmtp()) {
      try {
        return await this.sendViaSmtp(deliverable, message);
      } catch (err) {
        if (mode === 'auto' && this.hasBrevo()) {
          this.logger.warn('SMTP falló; reintentando mediante Brevo HTTPS API.');
          return this.sendViaBrevo(deliverable, message);
        }
        throw err;
      }
    }

    throw new Error(
      'Configura SMTP_HOST/SMTP_USER/SMTP_PASSWORD/SMTP_FROM o BREVO_API_KEY/MAIL_FROM_ADDRESS para enviar correos.',
    );
  }

  private async sendViaSmtp(recipients: string[], message: MailMessage): Promise<MailSendResult> {
    const host = process.env.SMTP_HOST!.trim();
    const user = process.env.SMTP_USER!.trim();
    const pass = process.env.SMTP_PASSWORD!.trim();
    const from = this.resolveFrom();
    const port = Number(process.env.SMTP_PORT ?? 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT debe ser un puerto válido.');
    }
    const secure = process.env.SMTP_SECURE === 'true';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to: recipients.join(', '),
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return { provider: 'smtp', messageId: info?.messageId };
  }

  private async sendViaBrevo(recipients: string[], message: MailMessage): Promise<MailSendResult> {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const rawFrom = this.resolveFrom();
    if (!apiKey || !rawFrom) {
      throw new Error('BREVO_API_KEY o correo remitente no configurado.');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: parseSender(rawFrom),
        to: recipients.map(email => ({ email })),
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const payload = (await response.json().catch(() => ({}))) as { messageId?: string; message?: string; code?: string };
    if (!response.ok || !payload.messageId) {
      throw new Error(`Brevo rechazó el correo (HTTP ${response.status}${payload.code ? `: ${payload.code}` : ''}).`);
    }

    return { provider: 'brevo', messageId: payload.messageId };
  }
}
