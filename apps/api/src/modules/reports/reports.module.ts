import { Module } from '@nestjs/common';
import { ReportsService } from './application/service';
import { AiReportAdvisor, ReportDocumentExporter } from './domain/ai-advisor';
import { ReportsRepository } from './domain/repository';
import { GeminiAiReportAdvisor } from './infrastructure/gemini-ai.advisor';
import { PostgresReportsRepository } from './infrastructure/postgres.repository';
import { PdfExcelReportExporter } from './infrastructure/report-document.exporter';
import { ReportsController } from './presentation/controller';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    { provide: ReportsRepository, useClass: PostgresReportsRepository },
    { provide: AiReportAdvisor, useClass: GeminiAiReportAdvisor },
    { provide: ReportDocumentExporter, useClass: PdfExcelReportExporter },
  ],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
