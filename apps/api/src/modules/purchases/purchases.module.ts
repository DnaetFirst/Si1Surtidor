import { Module } from '@nestjs/common';
import { ProvidersModule } from './providers/providers.module';
import { PurchaseOrdersModule } from './orders/orders.module';
import { PurchaseReceiptsModule } from './receipts/receipts.module';

@Module({
  imports: [ProvidersModule, PurchaseOrdersModule, PurchaseReceiptsModule],
  exports: [ProvidersModule, PurchaseOrdersModule, PurchaseReceiptsModule],
})
export class PurchasesModule {}
