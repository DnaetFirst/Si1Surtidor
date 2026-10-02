import { Module } from '@nestjs/common';
import { PermissionsService } from './application/service';
import { PermissionsRepository } from './domain/repository';
import { PostgresPermissionsRepository } from './infrastructure/postgres.repository';
import { PermissionsController } from './presentation/controller';
@Module({ controllers: [PermissionsController], providers: [PermissionsService, { provide: PermissionsRepository, useClass: PostgresPermissionsRepository }] })
export class PermissionsModule {
}
