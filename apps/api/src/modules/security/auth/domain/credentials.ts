import { SessionUser } from '../../../../shared/domain/context';
export abstract class PasswordHasher {
    abstract hash(password: string): Promise<string>;
    abstract verify(password: string, hash: string): Promise<boolean>;
}
export abstract class SessionTokens {
    abstract digest(token: string): string;
    abstract sessionId(): string;
    abstract refresh(id: string): string;
    abstract dummyPassword(): string;
    abstract access(user: SessionUser, id: string): string;
    abstract verify(token: string, ignoreExpiration?: boolean): {
        sub?: string;
        sid?: unknown;
    };
}
