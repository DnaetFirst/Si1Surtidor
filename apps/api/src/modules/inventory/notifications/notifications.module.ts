import { Module } from '@nestjs/common';
import { NotificationService } from './application/service';
import { NotificationRepository } from './domain/repository';
import { PostgresNotificationRepository } from './infrastructure/postgres.repository';
import { NotificationsController } from './presentation/controller';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    {
      provide: NotificationRepository,
      useClass: PostgresNotificationRepository,
    },
  ],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationsModule {}
