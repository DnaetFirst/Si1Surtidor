import { Module } from '@nestjs/common';
import { CategoryGroupModule } from './categories-groups/category-group.module';
import { FuelModule } from './fuels/fuel.module';
import { ProductModule } from './products/product.module';

@Module({
  imports: [CategoryGroupModule, FuelModule, ProductModule],
  exports: [CategoryGroupModule, FuelModule, ProductModule],
})
export class InventoryModule {}
