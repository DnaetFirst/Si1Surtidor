import { Injectable } from '@nestjs/common';
import { AppMailer } from '../../../../shared/domain/mailer';
import { PasswordResetMailer } from '../domain/password-reset-mailer';

@Injectable()
export class SmtpPasswordResetMailer extends PasswordResetMailer {
    constructor(private readonly mailer: AppMailer) {
        super();
    }

    async send(email: string, token: string) {
        const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
        const url = new URL('/restablecer-contrasena', origin);
        url.hash = new URLSearchParams({ token }).toString();
        await this.mailer.send({
            to: [email],
            subject: 'Restablecer contraseña · Mi Gasolinera',
            text: `Recibimos una solicitud para restablecer tu contraseña. Abre este enlace, válido durante 30 minutos: ${url.toString()}\n\nSi no solicitaste este cambio, ignora este mensaje.`,
            html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${url.toString()}">Restablecer contraseña</a></p><p>El enlace vence en 30 minutos. Si no solicitaste este cambio, ignora este mensaje.</p>`
        });
    }

    // Alias de trazabilidad con diagramas UML (CU18)
    sendPasswordResetEmail(email: string, token: string) { return this.send(email, token); }
    EnviarCorreoSMTP(email: string, token: string) { return this.send(email, token); }
}

export { SmtpPasswordResetMailer as MailerService };
