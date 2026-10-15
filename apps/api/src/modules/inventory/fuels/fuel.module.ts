import { Module } from '@nestjs/common';
import { FuelService } from './application/service';
import { FuelRepository } from './domain/repository';
import { PostgresFuelRepository } from './infrastructure/postgres.repository';
import { FuelController } from './presentation/controller';

@Module({
  controllers: [FuelController],
  providers: [
    FuelService,
    { provide: FuelRepository, useClass: PostgresFuelRepository },
  ],
  exports: [FuelService, FuelRepository],
})
export class FuelModule {}
