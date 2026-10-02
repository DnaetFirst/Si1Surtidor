import { download, send } from '../../../../shared/infrastructure/http';
import { PermissionsApi } from '../domain/repository';
import { Capability, Permission } from '../domain/models';
export const permissionsApi: PermissionsApi = {
    disable: (target: Permission) => send(`/permisos/${target.id}/deshabilitar`, 'POST'),
    listKey: (params: string, page: number) => `/permisos?${params}&page=${page}&pageSize=10`,
    exportCsv: (params: string) => download(`/permisos/exportar?${params}`, 'permisos.csv'),
    detailKey: (id: string | undefined) => id ? `/permisos/${id}` : null,
    capabilitiesKey: (id: string | undefined) => !id ? '/permisos/capacidades' : null,
    save: (id: string | undefined, form: Record<string, string>, capability: Capability | undefined) => send(id ? `/permisos/${id}` : '/permisos', id ? 'PATCH' : 'POST', { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), ...(!id && capability ? { modulo: capability.modulo, accion: capability.accion } : {}) })
};
