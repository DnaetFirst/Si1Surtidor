import { Branch } from '../../../enterprise/branches/domain/models';
import { Role } from '../../roles/domain/models';
export interface User {
    ci: string;
    nombre: string;
    correo: string;
    telefono: string;
    cargo?: string;
    sexo: string;
    domicilio: string;
    rolId: number;
    sucursalId?: number | null;
    activo: boolean;
    createdAt: string;
    rol: Pick<Role, 'id' | 'codigo' | 'nombre'>;
    sucursal?: Branch;
}
