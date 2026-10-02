import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('public', true);
export const RequirePermissions = (...permissions: string[]) => SetMetadata('permissions', permissions);
