import { Module } from '@nestjs/common';
import { SaleService } from './application/service';
import { SaleRepository } from './domain/repository';
import { PostgresSaleRepository } from './infrastructure/postgres.repository';
import { SalesController } from './presentation/controller';

@Module({
  controllers: [SalesController],
  providers: [
    SaleService,
    {
      provide: SaleRepository,
      useClass: PostgresSaleRepository,
    },
  ],
  exports: [SaleService, SaleRepository],
})
export class SalesNotesModule {}
