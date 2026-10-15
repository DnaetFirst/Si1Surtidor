import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { SessionRepository } from '../domain/repository';
@Injectable()
export class PostgresSessionRepository extends SessionRepository {
    constructor(private readonly db: DataSource) { super(); }
    async identity(ci: string, tx?: TransactionContext) {
        return database(this.db, tx).query(`SELECT u.ci,u.nombre,u.correo,r.id AS "rolId",r.codigo AS "rolCodigo",r.nombre AS "rolNombre"
      FROM usuario u JOIN rol r ON r.id=u.id_rol WHERE u.ci=$1 AND u.activo AND r.activo`, [ci]);
    }
    async permissions(row: {
        rolId: number;
    }, tx?: TransactionContext) {
        return database(this.db, tx).query(`SELECT p.codigo,p.reservado FROM permiso p
      WHERE p.activo AND (EXISTS(SELECT 1 FROM rol r WHERE r.id=$1 AND r.codigo='ASU' AND r.activo)
      OR EXISTS(SELECT 1 FROM permiso_rol pr WHERE pr.id_permiso=p.id AND pr.id_rol=$1))`, [row.rolId]);
    }
    async lockUser(identity: string, tx?: TransactionContext) { return database(this.db, tx).query('SELECT * FROM usuario WHERE lower(correo)=$1 FOR UPDATE', [identity]); }
    async failedAttempt(row: {
        ci: string;
    }, attempts: number, tx?: TransactionContext) {
        return database(this.db, tx).query(`UPDATE usuario SET intentos_fallidos=$2,
          bloqueado_hasta=CASE WHEN $2>=3 THEN now()+interval '15 minutes' ELSE NULL END WHERE ci=$1`, [row.ci, attempts]);
    }
    async clearAttempts(row: {
        ci: string;
    }, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE usuario SET intentos_fallidos=0,bloqueado_hasta=NULL WHERE ci=$1', [row.ci]); }
    async createSession(id: string, row: {
        ci: string;
    }, refreshHash: string, expiresAt: Date, tx?: TransactionContext) { return database(this.db, tx).query('INSERT INTO sesion(id,ci_usuario,refresh_hash,expires_at) VALUES($1,$2,$3,$4)', [id, row.ci, refreshHash, expiresAt]); }
    async activeSession(payload: {
        sid?: unknown;
        sub?: string;
    }, tx?: TransactionContext) { return database(this.db, tx).query('SELECT 1 FROM sesion WHERE id=$1 AND ci_usuario=$2 AND revoked_at IS NULL AND expires_at>now()', [payload.sid, payload.sub]); }
    async lockSession(id: string, tx?: TransactionContext) { return database(this.db, tx).query('SELECT * FROM sesion WHERE id=$1 AND revoked_at IS NULL AND expires_at>now() FOR UPDATE', [id]); }
    async rotate(id: string, refreshHash: string, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE sesion SET refresh_hash=$2 WHERE id=$1', [id, refreshHash]); }
    async lockForLogout(signedSession: {
        sid: string;
        sub: string;
    } | undefined, token: string | undefined, refreshHash: string, tx?: TransactionContext) {
        return database(this.db, tx).query(`SELECT s.*,u.nombre FROM sesion s JOIN usuario u ON u.ci=s.ci_usuario
        WHERE s.id=$1 AND ${signedSession ? 's.ci_usuario=$2' : 's.refresh_hash=$2'} AND s.revoked_at IS NULL FOR UPDATE OF s`, signedSession ? [signedSession.sid, signedSession.sub] : [token!.split('.')[0], refreshHash]);
    }
    async revoke(session: {
        id: string;
    }, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE sesion SET revoked_at=now() WHERE id=$1', [session.id]); }
    async passwordResetIdentity(email: string) {
        return this.db.query('SELECT ci,correo FROM usuario WHERE lower(correo)=$1 AND activo=true', [email]);
    }
    async invalidatePasswordResets(ci: string, tx?: TransactionContext) {
        return database(this.db, tx).query('UPDATE password_reset_token SET used_at=now() WHERE ci_usuario=$1 AND used_at IS NULL', [ci]);
    }
    async createPasswordReset(ci: string, tokenHash: string, expiresAt: Date, tx?: TransactionContext) {
        return database(this.db, tx).query('INSERT INTO password_reset_token(token_hash,ci_usuario,expires_at) VALUES($1,$2,$3)', [tokenHash, ci, expiresAt]);
    }
    async lockPasswordReset(tokenHash: string, tx?: TransactionContext) {
        return database(this.db, tx).query(`SELECT pr.ci_usuario AS ci FROM password_reset_token pr
        JOIN usuario u ON u.ci=pr.ci_usuario WHERE pr.token_hash=$1 AND pr.used_at IS NULL
        AND pr.expires_at>now() AND u.activo=true FOR UPDATE OF pr`, [tokenHash]);
    }
    async updatePasswordAndRevokeSessions(ci: string, passwordHash: string, tx?: TransactionContext) {
        const db = database(this.db, tx);
        const result = await db.query(`UPDATE usuario SET password_hash=$2,intentos_fallidos=0,bloqueado_hasta=NULL,
        updated_at=now() WHERE ci=$1`, [ci, passwordHash]);
        await db.query('UPDATE sesion SET revoked_at=now() WHERE ci_usuario=$1 AND revoked_at IS NULL', [ci]);
        return result;
    }
    async consumePasswordReset(tokenHash: string, tx?: TransactionContext) {
        return database(this.db, tx).query('UPDATE password_reset_token SET used_at=now() WHERE token_hash=$1', [tokenHash]);
    }
}
