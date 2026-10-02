import { Role } from '../../roles/domain/models';
export interface SessionUser {
    ci: string;
    nombre: string;
    correo: string;
    rol: Pick<Role, 'id' | 'codigo' | 'nombre'>;
    permisos: string[];
}
