import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './application/service';
import { PurchaseOrderRepository } from './domain/repository';
import { PostgresPurchaseOrderRepository } from './infrastructure/postgres.repository';
import { PurchaseOrdersController } from './presentation/controller';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [
    PurchaseOrderService,
    {
      provide: PurchaseOrderRepository,
      useClass: PostgresPurchaseOrderRepository,
    },
  ],
  exports: [PurchaseOrderService, PurchaseOrderRepository],
})
export class PurchaseOrdersModule {}
