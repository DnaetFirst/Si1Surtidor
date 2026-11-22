import { Module } from '@nestjs/common';
import { DispenserService } from './application/service';
import { DispenserRepository } from './domain/repository';
import { PostgresDispenserRepository } from './infrastructure/postgres.repository';
import { DispensersController } from './presentation/controller';

@Module({
  controllers: [DispensersController],
  providers: [
    DispenserService,
    { provide: DispenserRepository, useClass: PostgresDispenserRepository },
  ],
  exports: [DispenserService, DispenserRepository],
})
export class DispensersModule {}
