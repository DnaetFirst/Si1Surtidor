import { send } from '../../../../shared/infrastructure/http';
import { BranchesApi } from '../domain/repository';
export const branchesApi: BranchesApi = {
    listKey: (page, q, activo) => '/sucursales/gestion?' + new URLSearchParams({ page: String(page), pageSize: '10', q, activo }),
    detailKey: id => id ? '/sucursales/' + encodeURIComponent(id) : null,
    save: (id, data) => send(id ? '/sucursales/' + encodeURIComponent(id) : '/sucursales', id ? 'PATCH' : 'POST', data),
    disable: id => send('/sucursales/' + id + '/deshabilitar', 'POST', {}),
};
