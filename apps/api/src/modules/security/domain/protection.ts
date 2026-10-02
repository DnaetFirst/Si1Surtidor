import { BadRequestException, ConflictException, ForbiddenException } from '../../../shared/domain/errors';
export function assertImmutableCI(current: string, incoming?: string) { if (incoming !== undefined && incoming !== current)
    throw new BadRequestException('El CI identifica al usuario y no se puede modificar.'); }
export function assertAccountEditable(actorRole: string, targetRole: string) { if (targetRole === 'ASU' && actorRole !== 'ASU')
    throw new ForbiddenException('La cuenta ASU está protegida.'); }
export function assertAdministrativeContinuity(exists: boolean) { if (!exists)
    throw new ConflictException('Debe conservar al menos un ATI activo con capacidad para administrar usuarios y roles.'); }
export function assertPermissionSelection(actorRole: string, expected: number, permissions: {
    reservado: boolean;
}[]) {
    if (permissions.length !== expected)
        throw new BadRequestException('Todos los permisos deben existir y estar activos.');
    if (actorRole !== 'ASU' && permissions.some(p => p.reservado))
        throw new ForbiddenException('Los privilegios de seguridad están reservados al ASU.');
}
