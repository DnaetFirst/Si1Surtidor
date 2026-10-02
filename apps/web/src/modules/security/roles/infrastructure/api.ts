import { query } from '../../../../shared/domain/query';
import { send } from '../../../../shared/infrastructure/http';
import { RolesApi } from '../domain/repository';
import { Role } from '../domain/models';
export const rolesApi: RolesApi = {
    disable: (target: Role) => send(`/roles/${target.id}/deshabilitar`, 'POST'),
    listKey: (page: number, search: string, active: string) => `/roles?${query({ page, pageSize: 10, q: search, activo: active })}`,
    detailKey: (id: string | undefined) => id ? `/roles/${id}` : null,
    assignablePermissionsKey: () => '/permisos/asignables',
    save: (id: string | undefined, nombre: string, selected: number[]) => send(id ? `/roles/${id}` : '/roles', id ? 'PATCH' : 'POST', { nombre: nombre.trim(), permisoIds: selected })
};
