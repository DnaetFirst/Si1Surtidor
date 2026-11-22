import { Module } from '@nestjs/common';
import { CategoryGroupModule } from './categories-groups/category-group.module';
import { FuelModule } from './fuels/fuel.module';
import { ProductModule } from './products/product.module';
import { ProductExitsModule } from './exits/exits.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [CategoryGroupModule, FuelModule, ProductModule, ProductExitsModule, NotificationsModule],
  exports: [CategoryGroupModule, FuelModule, ProductModule, ProductExitsModule, NotificationsModule],
})
export class InventoryModule {}
