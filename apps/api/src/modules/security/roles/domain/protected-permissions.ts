import { ConflictException } from '../../../../shared/domain/errors';

export const ASU_PROTECTED_PERMISSIONS = [
    'permisos.gestionar', 'bitacora.ver', 'bitacora.exportar', 'bitacora.archivar',
] as const;

export function protectedPermissionIds(role: { codigo: string; permisos: { id: number; codigo: string }[] }): number[] {
    if (role.codigo !== 'ASU') return [];
    return role.permisos.filter(permission => (ASU_PROTECTED_PERMISSIONS as readonly string[]).includes(permission.codigo)).map(permission => permission.id);
}

export function assertProtectedPermissions(role: { codigo: string; permisos: { id: number; codigo: string }[] }, selected: number[]): void {
    if (protectedPermissionIds(role).some(id => !selected.includes(id))) {
        throw new ConflictException('Los permisos esenciales del ASU están protegidos. Puede agregar o quitar únicamente permisos adicionales.');
    }
}
