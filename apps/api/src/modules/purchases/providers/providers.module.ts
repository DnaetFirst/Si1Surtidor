import { Module } from '@nestjs/common';
import { ProviderService } from './application/service';
import { ProviderRepository } from './domain/repository';
import { PostgresProviderRepository } from './infrastructure/postgres.repository';
import { ProvidersController } from './presentation/controller';

@Module({
  controllers: [ProvidersController],
  providers: [
    ProviderService,
    { provide: ProviderRepository, useClass: PostgresProviderRepository },
  ],
  exports: [ProviderService, ProviderRepository],
})
export class ProvidersModule {}
