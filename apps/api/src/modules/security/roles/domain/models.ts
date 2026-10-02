import { PermissionRecord } from '../../permissions/domain/models';
export interface RoleRecord {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
    createdAt: Date;
    usuariosCount: number;
    permisos: PermissionRecord[];
    permisoIds?: number[];
}
export interface RoleOption {
    id: number;
    codigo: string;
    nombre: string;
}
