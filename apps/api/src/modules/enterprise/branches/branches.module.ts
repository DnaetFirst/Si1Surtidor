import { Module } from '@nestjs/common';
import { BranchesService } from './application/service';
import { BranchesRepository } from './domain/repository';
import { PostgresBranchesRepository } from './infrastructure/postgres.repository';
import { BranchesController } from './presentation/controller';
@Module({ controllers: [BranchesController], providers: [BranchesService, { provide: BranchesRepository, useClass: PostgresBranchesRepository }] })
export class BranchesModule {
}
