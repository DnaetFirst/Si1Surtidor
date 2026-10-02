import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { AuthApi } from '../domain/repository';
export const { Provider: AuthApiProvider, useAdapter: useAuthApi } = createAdapterContext<AuthApi>('auth');
