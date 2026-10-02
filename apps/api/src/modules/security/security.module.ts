import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
@Module({ imports: [AuthModule, UsersModule, RolesModule, PermissionsModule] })
export class SecurityModule {
}
