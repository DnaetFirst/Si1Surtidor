import { Module } from '@nestjs/common';
import { AuditService } from './application/service';
import { AuditRepository } from './domain/repository';
import { PostgresAuditRepository } from './infrastructure/postgres.repository';
import { AuditController } from './presentation/controller';
@Module({ controllers: [AuditController], providers: [AuditService, { provide: AuditRepository, useClass: PostgresAuditRepository }] })
export class AuditModule {
}
