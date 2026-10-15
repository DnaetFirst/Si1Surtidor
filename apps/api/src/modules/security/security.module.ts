import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { SystemModuleModule } from './system-modules/system-module.module';
import { UsersModule } from './users/users.module';
@Module({ imports: [AuthModule, UsersModule, RolesModule, PermissionsModule, SystemModuleModule] })
export class SecurityModule {
}
