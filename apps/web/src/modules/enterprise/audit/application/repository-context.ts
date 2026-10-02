import { createAdapterContext } from '../../../../shared/application/adapter-context';
import { AuditApi } from '../domain/repository';
export const { Provider: AuditApiProvider, useAdapter: useAuditApi } = createAdapterContext<AuditApi>('audit');
