import { ConflictException } from '../../../../shared/domain/errors';

export function protectedPermissionIds(role: { codigo: string; permisos: { id: number; codigo: string }[] }): number[] {
    if (role.codigo !== 'ASU') return [];
    return role.permisos.map(permission => permission.id);
}

export function assertProtectedPermissions(role: { codigo: string; permisos: { id: number; codigo: string }[] }, selected: number[]): void {
    if (protectedPermissionIds(role).some(id => !selected.includes(id))) {
        throw new ConflictException('El ASU dispone automáticamente de todos los permisos activos. No se pueden quitar permisos de este rol.');
    }
}
