import { send } from '../../../../shared/infrastructure/http';
import { SystemModule } from '../domain/models';
import { SystemModulesApi } from '../domain/repository';

export const systemModulesApi: SystemModulesApi = {
  listKey: () => '/modulos',
  create: (data: Partial<SystemModule>) => send<SystemModule>('/modulos', 'POST', data),
  update: (id: number, data: Partial<SystemModule>) => send<SystemModule>(`/modulos/${id}`, 'PATCH', data),
  delete: (id: number) => send<void>(`/modulos/${id}`, 'DELETE'),
};
