import { Module } from '@nestjs/common';
import { RolesService } from './application/service';
import { RolesRepository } from './domain/repository';
import { PostgresRolesRepository } from './infrastructure/postgres.repository';
import { RolesController } from './presentation/controller';
@Module({ controllers: [RolesController], providers: [RolesService, { provide: RolesRepository, useClass: PostgresRolesRepository }] })
export class RolesModule {
}
