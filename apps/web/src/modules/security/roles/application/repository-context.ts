import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { RolesApi } from '../domain/repository';
export const { Provider: RolesApiProvider, useAdapter: useRolesApi } = createAdapterContext<RolesApi>('roles');
