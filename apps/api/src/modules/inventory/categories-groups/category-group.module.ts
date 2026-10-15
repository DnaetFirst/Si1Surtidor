import { Module } from '@nestjs/common';
import { CategoryGroupService } from './application/service';
import { CategoryGroupRepository } from './domain/repository';
import { PostgresCategoryGroupRepository } from './infrastructure/postgres.repository';
import { CategoryController, GroupController } from './presentation/controller';

@Module({
  controllers: [CategoryController, GroupController],
  providers: [
    CategoryGroupService,
    { provide: CategoryGroupRepository, useClass: PostgresCategoryGroupRepository },
  ],
  exports: [CategoryGroupService, CategoryGroupRepository],
})
export class CategoryGroupModule {}
