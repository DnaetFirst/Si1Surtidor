import { Module } from '@nestjs/common';
import { UsersService } from './application/service';
import { UsersRepository } from './domain/repository';
import { PostgresUsersRepository } from './infrastructure/postgres.repository';
import { UsersController } from './presentation/controller';
@Module({ controllers: [UsersController], providers: [UsersService, { provide: UsersRepository, useClass: PostgresUsersRepository }] })
export class UsersModule {
}
