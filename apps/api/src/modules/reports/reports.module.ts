import { Module } from '@nestjs/common';
import { ReportsService } from './application/service';
import { ReportsRepository } from './domain/repository';
import { PostgresReportsRepository } from './infrastructure/postgres.repository';
import { ReportsController } from './presentation/controller';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    { provide: ReportsRepository, useClass: PostgresReportsRepository },
  ],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
