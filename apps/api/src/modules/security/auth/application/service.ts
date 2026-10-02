import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuditWriter, RequestContext, SessionUser, TransactionContext, UnitOfWork } from '../../../../shared/domain/context';
import { PasswordHasher, SessionTokens } from '../domain/credentials';
import { SessionRepository } from '../domain/repository';
@Injectable()
export class AuthService {
    private readonly dummyHash: Promise<string>;
    constructor(private readonly repository: SessionRepository, private readonly unitOfWork: UnitOfWork, private readonly passwords: PasswordHasher, private readonly tokens: SessionTokens, private readonly auditWriter: AuditWriter) { this.dummyHash = passwords.hash(tokens.dummyPassword()); }
    async getUser(ci: string, em?: TransactionContext): Promise<SessionUser | null> {
        const [row] = await this.repository.identity(ci, em);
        if (!row)
            return null;
        const permissions = await this.repository.permissions(row, em);
        return { ci: row.ci, nombre: row.nombre, correo: row.correo,
            rol: { id: row.rolId, codigo: row.rolCodigo, nombre: row.rolNombre },
            permisos: permissions.filter((p: any) => !p.reservado || row.rolCodigo === 'ASU').map((p: any) => p.codigo) };
    }
    async login(correo: string, password: string, req: RequestContext) {
        const identity = correo.trim().toLowerCase();
        const outcome = await this.unitOfWork.transaction(async (em) => {
            const [row] = await this.repository.lockUser(identity, em);
            if (!row) {
                await this.passwords.verify(password, await this.dummyHash);
                await this.auditWriter.authentication(req, 'AUTH_FAILURE', 'INVALID', undefined, identity, em);
                return { error: 401, message: 'Correo o contraseña incorrectos.' };
            }
            if (row.bloqueado_hasta && new Date(row.bloqueado_hasta).getTime() > Date.now()) {
                await this.auditWriter.authentication(req, 'AUTH_FAILURE', 'LOCKED', row, identity, em);
                return { error: 423, message: 'Cuenta bloqueada temporalmente. Intenta nuevamente al terminar los 15 minutos.',
                    retryAfterSeconds: Math.ceil((new Date(row.bloqueado_hasta).getTime() - Date.now()) / 1000) };
            }
            if (!await this.passwords.verify(password, row.password_hash)) {
                const attempts = (row.bloqueado_hasta ? 0 : row.intentos_fallidos) + 1;
                await this.repository.failedAttempt(row, attempts, em);
                await this.auditWriter.authentication(req, 'AUTH_FAILURE', 'INVALID', row, identity, em);
                if (attempts >= 3) {
                    await this.auditWriter.authentication(req, 'AUTH_LOCKOUT', 'LOCKED', row, identity, em);
                    return { error: 423, message: 'Cuenta bloqueada por 15 minutos después de tres intentos fallidos.', retryAfterSeconds: 900 };
                }
                return { error: 401, message: 'Correo o contraseña incorrectos.' };
            }
            const user = await this.getUser(row.ci, em);
            if (!user) {
                await this.auditWriter.authentication(req, 'AUTH_FAILURE', 'DISABLED', row, identity, em);
                return { error: 401, message: 'Cuenta deshabilitada. Contacta al administrador.' };
            }
            await this.repository.clearAttempts(row, em);
            const id = this.tokens.sessionId();
            const refresh = this.tokens.refresh(id);
            const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
            await this.repository.createSession(id, row, this.tokens.digest(refresh), expiresAt, em);
            await this.auditWriter.authentication(req, 'AUTH_LOGIN', 'SUCCESS', row, identity, em);
            return { user, access: this.tokens.access(user, id), refresh, expiresAt };
        });
        if ('error' in outcome)
            throw new HttpException({ statusCode: outcome.error, message: outcome.message,
                retryAfterSeconds: outcome.retryAfterSeconds }, outcome.error!);
        return outcome;
    }
    async authenticate(token?: string): Promise<{
        user: SessionUser;
        sessionId: string;
    }> {
        try {
            if (!token)
                throw new Error();
            const payload = this.tokens.verify(token);
            if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string')
                throw new Error();
            const [session] = await this.repository.activeSession(payload);
            if (!session)
                throw new Error();
            const user = await this.getUser(payload.sub);
            if (!user)
                throw new Error();
            return { user, sessionId: payload.sid };
        }
        catch {
            throw new UnauthorizedException('Tu sesión terminó. Inicia sesión nuevamente.');
        }
    }
    async refresh(token?: string) {
        if (!token || !/^[a-f0-9-]{36}\.[a-f0-9]{96}$/.test(token))
            throw new UnauthorizedException('Sesión expirada.');
        const id = token.split('.')[0];
        const result = await this.unitOfWork.transaction(async (em) => {
            const [session] = await this.repository.lockSession(id, em);
            if (!session || this.tokens.digest(token) !== session.refresh_hash)
                return null;
            const user = await this.getUser(session.ci_usuario, em);
            if (!user)
                return null;
            const refresh = this.tokens.refresh(id);
            await this.repository.rotate(id, this.tokens.digest(refresh), em);
            return { user, access: this.tokens.access(user, id), refresh, expiresAt: new Date(session.expires_at) };
        });
        if (!result)
            throw new UnauthorizedException('Sesión expirada.');
        return result;
    }
    async logout(req: RequestContext, token?: string) {
        let signedSession: {
            sid: string;
            sub: string;
        } | undefined;
        try {
            const payload = this.tokens.verify(req.cookies?.access_token ?? '', true);
            if (typeof payload.sid === 'string' && typeof payload.sub === 'string')
                signedSession = { sid: payload.sid, sub: payload.sub };
        }
        catch { /* A valid refresh cookie may still authorize revocation. */ }
        if (!signedSession && (!token || !/^[a-f0-9-]{36}\.[a-f0-9]{96}$/.test(token)))
            return;
        await this.unitOfWork.transaction(async (em) => {
            const [session] = await this.repository.lockForLogout(signedSession, token, this.tokens.digest(token ?? ""), em);
            if (!session)
                return;
            await this.repository.revoke(session, em);
            await this.auditWriter.authentication(req, 'AUTH_LOGOUT', 'SUCCESS', { ci: session.ci_usuario, nombre: session.nombre }, undefined, em);
        });
    }
}
