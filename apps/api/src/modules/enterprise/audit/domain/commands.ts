import { ListQuery } from '../../../../shared/domain/pagination';
export interface AuditQuery extends ListQuery {
    desde?: string;
    hasta?: string;
    usuario?: string;
    accion?: string;
    archivado: string;
    periodo?: string;
}
export interface ArchiveDto {
    desde: string;
    hasta: string;
}
