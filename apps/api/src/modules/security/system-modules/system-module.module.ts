import { Module } from '@nestjs/common';
import { SystemModuleService } from './application/service';
import { SystemModuleRepository } from './domain/repository';
import { PostgresSystemModuleRepository } from './infrastructure/postgres.repository';
import { SystemModuleController } from './presentation/controller';

@Module({
  controllers: [SystemModuleController],
  providers: [
    SystemModuleService,
    { provide: SystemModuleRepository, useClass: PostgresSystemModuleRepository },
  ],
  exports: [SystemModuleService, SystemModuleRepository],
})
export class SystemModuleModule {}
