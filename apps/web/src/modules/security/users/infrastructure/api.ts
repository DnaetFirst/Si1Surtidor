import { query } from '../../../../shared/domain/query';
import { send } from '../../../../shared/infrastructure/http';
import { UsersApi } from '../domain/repository';
import { User } from '../domain/models';
export const usersApi: UsersApi = {
    disable: (target: User) => send(`/usuarios/${encodeURIComponent(target.ci)}/deshabilitar`, 'POST'),
    listKey: (page: number, search: string, active: string) => `/usuarios?${query({ page, pageSize: 10, q: search, activo: active })}`,
    detailKey: (ci: string | undefined) => ci ? `/usuarios/${encodeURIComponent(ci)}` : null,
    roleOptionsKey: (readonly: boolean) => !readonly ? '/roles/opciones' : null,
    branchesKey: (readonly: boolean) => !readonly ? '/sucursales' : null,
    save: (ci: string | undefined, payload: unknown) => send(ci ? `/usuarios/${encodeURIComponent(ci!)}` : '/usuarios', ci ? 'PATCH' : 'POST', payload)
};
