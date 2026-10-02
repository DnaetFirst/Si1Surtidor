import { download, send } from '../../../../shared/infrastructure/http';
import { AuditApi } from '../domain/repository';
import { beginning, end } from '../domain/form';
export const auditApi: AuditApi = {
    listKey: (params: string, page: number) => `/bitacora?${params}&page=${page}&pageSize=10`,
    exportCsv: (params: string, archived: boolean) => download(`/bitacora/exportar?${params}`, archived ? 'bitacora-archivada.csv' : 'bitacora.csv'),
    archive: (desde: string, hasta: string) => send<{
        total: number;
        mensaje: string;
    }>('/bitacora/archivar', 'POST', { desde: beginning(desde), hasta: end(hasta) })
};
