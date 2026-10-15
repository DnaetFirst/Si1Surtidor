import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { EnterpriseModule } from '../modules/enterprise/enterprise.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { SecurityModule } from '../modules/security/security.module';
import { HealthController } from './health.controller';
import { PlatformModule } from './platform.module';
@Module({ imports: [DatabaseModule, PlatformModule, SecurityModule, EnterpriseModule, InventoryModule], controllers: [HealthController] })
export class AppModule {
}
