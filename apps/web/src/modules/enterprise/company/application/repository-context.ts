import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { CompanyApi } from '../domain/repository';
export const { Provider: CompanyApiProvider, useAdapter: useCompanyApi } = createAdapterContext<CompanyApi>('company');
