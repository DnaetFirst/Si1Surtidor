import { TransactionContext } from '../../../../shared/domain/context';
import { IdentityRecord, LoginRecord, SessionRecord } from './models';
export abstract class SessionRepository {
    abstract identity(ci: string, tx?: TransactionContext): Promise<IdentityRecord[]>;
    abstract permissions(row: {
        rolId: number;
    }, tx?: TransactionContext): Promise<{
        codigo: string;
        reservado: boolean;
    }[]>;
    abstract lockUser(identity: string, tx?: TransactionContext): Promise<LoginRecord[]>;
    abstract failedAttempt(row: {
        ci: string;
    }, attempts: number, tx?: TransactionContext): Promise<unknown[]>;
    abstract clearAttempts(row: {
        ci: string;
    }, tx?: TransactionContext): Promise<unknown[]>;
    abstract createSession(id: string, row: {
        ci: string;
    }, refreshHash: string, expiresAt: Date, tx?: TransactionContext): Promise<unknown[]>;
    abstract activeSession(payload: {
        sid?: unknown;
        sub?: string;
    }, tx?: TransactionContext): Promise<unknown[]>;
    abstract lockSession(id: string, tx?: TransactionContext): Promise<SessionRecord[]>;
    abstract rotate(id: string, refreshHash: string, tx?: TransactionContext): Promise<unknown[]>;
    abstract lockForLogout(signedSession: {
        sid: string;
        sub: string;
    } | undefined, token: string | undefined, refreshHash: string, tx?: TransactionContext): Promise<SessionRecord[]>;
    abstract revoke(session: {
        id: string;
    }, tx?: TransactionContext): Promise<unknown[]>;
}
