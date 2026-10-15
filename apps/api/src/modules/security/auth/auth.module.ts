import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './application/service';
import { PasswordResetMailer } from './domain/password-reset-mailer';
import { SessionRepository } from './domain/repository';
import { PostgresSessionRepository } from './infrastructure/postgres.repository';
import { SmtpPasswordResetMailer } from './infrastructure/smtp-password-reset-mailer';
import { AuthController } from './presentation/auth.controller';
import { AuthGuard, CsrfGuard } from './presentation/guards';
@Module({ controllers: [AuthController], providers: [AuthService, CsrfGuard, { provide: SessionRepository, useClass: PostgresSessionRepository }, { provide: PasswordResetMailer, useClass: SmtpPasswordResetMailer }, { provide: APP_GUARD, useExisting: CsrfGuard }, { provide: APP_GUARD, useClass: AuthGuard }], exports: [AuthService] })
export class AuthModule {
}
