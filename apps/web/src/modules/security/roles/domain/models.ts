import { Permission } from '../../permissions/domain/models';
export interface Role {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
    permisos: Permission[];
    usuariosCount: number;
}
