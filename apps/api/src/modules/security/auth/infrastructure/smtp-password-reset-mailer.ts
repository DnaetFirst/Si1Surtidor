import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { PasswordResetMailer } from '../domain/password-reset-mailer';

@Injectable()
export class SmtpPasswordResetMailer extends PasswordResetMailer {
    async send(email: string, token: string) {
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const password = process.env.SMTP_PASSWORD;
        const from = process.env.SMTP_FROM;
        if (!host || !user || !password || !from)
            throw new Error('Configura SMTP_HOST, SMTP_USER, SMTP_PASSWORD y SMTP_FROM para enviar correos.');
        const port = Number(process.env.SMTP_PORT ?? 587);
        if (!Number.isInteger(port) || port < 1 || port > 65535)
            throw new Error('SMTP_PORT debe ser un puerto válido.');
        const secure = process.env.SMTP_SECURE === 'true';
        const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
        const url = new URL('/restablecer-contrasena', origin);
        url.hash = new URLSearchParams({ token }).toString();
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass: password }
        });
        await transporter.sendMail({
            from,
            to: email,
            subject: 'Restablecer contraseña · Mi Gasolinera',
            text: `Recibimos una solicitud para restablecer tu contraseña. Abre este enlace, válido durante 30 minutos: ${url.toString()}\n\nSi no solicitaste este cambio, ignora este mensaje.`,
            html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${url.toString()}">Restablecer contraseña</a></p><p>El enlace vence en 30 minutos. Si no solicitaste este cambio, ignora este mensaje.</p>`
        });
    }
}
