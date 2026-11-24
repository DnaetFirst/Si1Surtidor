import { Injectable } from '@nestjs/common';
import { AppMailer } from '../../../../shared/domain/mailer';
import { PasswordResetMailer } from '../domain/password-reset-mailer';

@Injectable()
export class SmtpPasswordResetMailer extends PasswordResetMailer {
    constructor(private readonly mailer: AppMailer) {
        super();
    }

    async send(email: string, token: string, code?: string) {
        const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
        const url = new URL('/restablecer-contrasena', origin);
        url.hash = new URLSearchParams({ token }).toString();
        const codeBlock = code
            ? `<div style="margin: 18px 0; padding: 14px 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
                 <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Código de verificación</div>
                 <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${code}</div>
               </div>`
            : '';
        const textCode = code ? `Tu código de verificación es: ${code}\n\n` : '';
        await this.mailer.send({
            to: [email],
            subject: 'Restablecer contraseña · Mi Gasolinera',
            text: `Recibimos una solicitud para restablecer tu contraseña.\n\n${textCode}Ingresa ese código en la pantalla de recuperación o abre este enlace (válido durante 30 minutos): ${url.toString()}\n\nSi no solicitaste este cambio, ignora este mensaje.`,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
              <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px;">Restablecer contraseña · Mi Gasolinera</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0;">Recibimos una solicitud para restablecer tu contraseña.</p>
              ${codeBlock}
              ${code ? '<p>En la pantalla de recuperación, ingresa el código y tu nueva contraseña.</p>' : ''}
              <p style="margin: 16px 0;"><a href="${url.toString()}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Restablecer contraseña</a></p>
              <p>Si prefieres usar el enlace, puedes copiarlo en tu navegador:</p>
              <p style="overflow-wrap:anywhere">${url.toString()}</p>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">El código y el enlace vencen en 30 minutos. Si no solicitaste este cambio, ignora este mensaje.</p>
            </div>`
        });
    }

    // Alias de trazabilidad con diagramas UML (CU18)
    sendPasswordResetEmail(email: string, token: string, code?: string) { return this.send(email, token, code); }
    EnviarCorreoSMTP(email: string, token: string, code?: string) { return this.send(email, token, code); }
}

export { SmtpPasswordResetMailer as MailerService };
