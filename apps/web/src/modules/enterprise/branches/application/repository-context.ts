import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { BranchesApi } from '../domain/repository';
export const { Provider: BranchesApiProvider, useAdapter: useBranchesApi } = createAdapterContext<BranchesApi>('branches');
