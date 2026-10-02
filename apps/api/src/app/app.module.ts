import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { EnterpriseModule } from '../modules/enterprise/enterprise.module';
import { SecurityModule } from '../modules/security/security.module';
import { HealthController } from './health.controller';
import { PlatformModule } from './platform.module';
@Module({ imports: [DatabaseModule, PlatformModule, SecurityModule, EnterpriseModule], controllers: [HealthController] })
export class AppModule {
}
