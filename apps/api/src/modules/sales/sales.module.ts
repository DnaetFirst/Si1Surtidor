import { Module } from '@nestjs/common';
import { DispensersModule } from './dispensers/dispensers.module';
import { DiscountsModule } from './discounts/discounts.module';
import { SalesNotesModule } from './sales-notes/sales-notes.module';

@Module({
  imports: [DispensersModule, DiscountsModule, SalesNotesModule],
  exports: [DispensersModule, DiscountsModule, SalesNotesModule],
})
export class SalesModule {}
