import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { EnterpriseModule } from '../modules/enterprise/enterprise.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { PurchasesModule } from '../modules/purchases/purchases.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { SalesModule } from '../modules/sales/sales.module';
import { SecurityModule } from '../modules/security/security.module';
import { HealthController } from './health.controller';
import { PlatformModule } from './platform.module';

@Module({
  imports: [
    DatabaseModule,
    PlatformModule,
    SecurityModule,
    EnterpriseModule,
    InventoryModule,
    PurchasesModule,
    SalesModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
