import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { PermissionsApi } from '../domain/repository';
export const { Provider: PermissionsApiProvider, useAdapter: usePermissionsApi } = createAdapterContext<PermissionsApi>('permissions');
