import { Global, Module } from '@nestjs/common';
import { secret } from '../infrastructure/config';
import { PostgresAuditWriter } from '../modules/enterprise/audit/infrastructure/audit-writer';
import { BranchDirectory } from '../modules/enterprise/branches/domain/directory';
import { PostgresBranchDirectory } from '../modules/enterprise/branches/infrastructure/directory';
import { AccessAdministrationPolicy } from '../modules/security/application/administration-policy';
import { AdministrativeTransactionService } from '../modules/security/application/administrative-transaction';
import { PasswordHasher, SessionTokens } from '../modules/security/auth/domain/credentials';
import { SecuritySettings } from '../modules/security/auth/domain/security-settings';
import { JwtSessionTokens, ScryptPasswordHasher } from '../modules/security/auth/infrastructure/credentials';
import { AdministrationPolicy } from '../modules/security/domain/administration-policy';
import { AdministrationRepository } from '../modules/security/domain/administration.repository';
import { MutationAuthorization } from '../modules/security/domain/mutation-authorization';
import { PostgresAdministrationRepository } from '../modules/security/infrastructure/administration-policy';
import { PostgresMutationAuthorization } from '../modules/security/infrastructure/mutation-authorization';
import { AdministrativeTransaction, AuditWriter, UnitOfWork } from '../shared/domain/context';
import { TypeOrmUnitOfWork } from '../shared/infrastructure/persistence/transaction';
@Global()
@Module({ providers: [
        { provide: SecuritySettings, useFactory: () => ({ csrfSecret: secret('CSRF_SECRET'), allowedOrigins: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim()) }) },
        { provide: BranchDirectory, useClass: PostgresBranchDirectory },
        { provide: PasswordHasher, useClass: ScryptPasswordHasher },
        { provide: SessionTokens, useClass: JwtSessionTokens },
        { provide: UnitOfWork, useClass: TypeOrmUnitOfWork },
        { provide: AdministrativeTransaction, useClass: AdministrativeTransactionService },
        { provide: MutationAuthorization, useClass: PostgresMutationAuthorization },
        { provide: AuditWriter, useClass: PostgresAuditWriter },
        { provide: AdministrationRepository, useClass: PostgresAdministrationRepository },
        { provide: AdministrationPolicy, useClass: AccessAdministrationPolicy },
    ], exports: [SecuritySettings, PasswordHasher, SessionTokens, UnitOfWork, AdministrativeTransaction, AuditWriter, AdministrationPolicy] })
export class PlatformModule {
}
