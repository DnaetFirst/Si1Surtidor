import { Module } from '@nestjs/common';
import { ProductExitService } from './application/service';
import { ProductExitRepository } from './domain/repository';
import { PostgresProductExitRepository } from './infrastructure/postgres.repository';
import { ProductExitsController } from './presentation/controller';

@Module({
  controllers: [ProductExitsController],
  providers: [
    ProductExitService,
    {
      provide: ProductExitRepository,
      useClass: PostgresProductExitRepository,
    },
  ],
  exports: [ProductExitService, ProductExitRepository],
})
export class ProductExitsModule {}
