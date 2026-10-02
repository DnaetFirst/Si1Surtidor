import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AuthService } from '../application/service';
import { SecuritySettings } from '../domain/security-settings';
import { AuthRequest } from './types';
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly auth: AuthService) { }
    async canActivate(ctx: ExecutionContext) {
        if (this.reflector.getAllAndOverride<boolean>('public', [ctx.getHandler(), ctx.getClass()]))
            return true;
        const req = ctx.switchToHttp().getRequest<AuthRequest>();
        const session = await this.auth.authenticate(req.cookies?.access_token);
        req.user = session.user;
        req.sessionId = session.sessionId;
        const permissions = this.reflector.getAllAndOverride<string[]>('permissions', [ctx.getHandler(), ctx.getClass()]);
        if (permissions?.length && !permissions.some(p => req.user.permisos.includes(p))) {
            throw new ForbiddenException('No tienes permiso para realizar esta operación.');
        }
        return true;
    }
}
@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(private readonly settings: SecuritySettings) { }
    private get key() { return this.settings.csrfSecret; }
    private sign(nonce: string) { return createHmac('sha256', this.key).update(nonce).digest('hex'); }
    private valid(token: string) {
        if (!/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(token))
            return false;
        const [nonce, signature] = token.split('.');
        return timingSafeEqual(Buffer.from(this.sign(nonce)), Buffer.from(signature));
    }
    issue(req: Request, res: Response) {
        const existing = req.cookies?.csrf_token;
        if (typeof existing === 'string' && this.valid(existing))
            return existing;
        const nonce = randomBytes(32).toString('hex');
        const token = `${nonce}.${this.sign(nonce)}`;
        res.cookie('csrf_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', path: '/', maxAge: 8 * 3600 * 1000 });
        return token;
    }
    canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest<Request>();
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method))
            return true;
        const cookie = req.cookies?.csrf_token;
        const header = req.headers['x-csrf-token'];
        if (typeof cookie !== 'string' || typeof header !== 'string' || cookie !== header || !this.valid(cookie)) {
            throw new ForbiddenException('Protección CSRF: recarga la página e intenta nuevamente.');
        }
        const origin = req.headers.origin;
        const allowed = this.settings.allowedOrigins;
        if (origin && !allowed.includes(origin))
            throw new ForbiddenException('Origen no permitido.');
        return true;
    }
}
