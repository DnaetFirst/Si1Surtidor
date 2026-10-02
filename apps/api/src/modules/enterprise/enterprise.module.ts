import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { CompanyModule } from './company/company.module';
@Module({ imports: [CompanyModule, BranchesModule, AuditModule] })
export class EnterpriseModule {
}
