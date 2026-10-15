import { Module } from '@nestjs/common';
import { ProductService } from './application/service';
import { ProductRepository } from './domain/repository';
import { PostgresProductRepository } from './infrastructure/postgres.repository';
import { ProductController } from './presentation/controller';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    { provide: ProductRepository, useClass: PostgresProductRepository },
  ],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
