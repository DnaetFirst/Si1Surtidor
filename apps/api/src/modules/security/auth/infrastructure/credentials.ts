import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { secret } from '../../../../infrastructure/config';
import { SessionUser } from '../../../../shared/domain/context';
import { PasswordHasher, SessionTokens } from '../domain/credentials';
import { hashPassword, verifyPassword } from './password';
@Injectable()
export class ScryptPasswordHasher extends PasswordHasher {
    hash(password: string) { return hashPassword(password); }
    verify(password: string, hash: string) { return verifyPassword(password, hash); }
}
@Injectable()
export class JwtSessionTokens extends SessionTokens {
    private readonly secret = secret('JWT_SECRET');
    digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
    sessionId() { return randomUUID(); }
    refresh(id: string) { return id + '.' + randomBytes(48).toString('hex'); }
    dummyPassword() { return randomBytes(32).toString('hex'); }
    access(user: SessionUser, id: string) { return jwt.sign({ sub: user.ci, sid: id }, this.secret, { expiresIn: '15m', issuer: 'mi-gasolinera', audience: 'mi-gasolinera-web', algorithm: 'HS256' }); }
    verify(token: string, ignoreExpiration = false) { return jwt.verify(token, this.secret, { issuer: 'mi-gasolinera', audience: 'mi-gasolinera-web', algorithms: ['HS256'], ignoreExpiration }) as jwt.JwtPayload; }
}
