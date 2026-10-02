import { Module } from '@nestjs/common';
import { CompanyService } from './application/service';
import { CompanyRepository } from './domain/repository';
import { PostgresCompanyRepository } from './infrastructure/postgres.repository';
import { CompanyController } from './presentation/controller';
@Module({ controllers: [CompanyController], providers: [CompanyService, { provide: CompanyRepository, useClass: PostgresCompanyRepository }] })
export class CompanyModule {
}
