import { Module } from '@nestjs/common';
import { DiscountService } from './application/service';
import { DiscountRepository } from './domain/repository';
import { PostgresDiscountRepository } from './infrastructure/postgres.repository';
import { DiscountsController } from './presentation/controller';

@Module({
  controllers: [DiscountsController],
  providers: [
    DiscountService,
    {
      provide: DiscountRepository,
      useClass: PostgresDiscountRepository,
    },
  ],
  exports: [DiscountService, DiscountRepository],
})
export class DiscountsModule {}
