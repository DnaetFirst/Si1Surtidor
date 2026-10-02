import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { UsersApi } from '../domain/repository';
export const { Provider: UsersApiProvider, useAdapter: useUsersApi } = createAdapterContext<UsersApi>('users');
