import { Module } from '@nestjs/common';
import { PurchaseReceiptService } from './application/service';
import { PurchaseReceiptRepository } from './domain/repository';
import { PostgresPurchaseReceiptRepository } from './infrastructure/postgres.repository';
import { PurchaseReceiptsController } from './presentation/controller';

@Module({
  controllers: [PurchaseReceiptsController],
  providers: [
    PurchaseReceiptService,
    {
      provide: PurchaseReceiptRepository,
      useClass: PostgresPurchaseReceiptRepository,
    },
  ],
  exports: [PurchaseReceiptService, PurchaseReceiptRepository],
})
export class PurchaseReceiptsModule {}
