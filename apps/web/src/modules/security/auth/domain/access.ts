import { SessionUser } from './models';

export function allowed(
    user: SessionUser | null,
    module: string,
    action = 'ver'
) {
    return !!user && (
        user.permisos.includes(`${module}.gestionar`) ||
        user.permisos.includes(`${module}.${action}`)
    );
}

export function firstPath(user: SessionUser | null) {
    const pages = [
        ['usuarios', '/usuarios'],
        ['roles', '/usuarios/roles'],
        ['permisos', '/usuarios/permisos'],
        ['modulos', '/usuarios/modulos'],
        ['empresa', '/empresa'],
        ['sucursales', '/empresa/sucursales'],
        ['bitacora', '/empresa/bitacora'],
        ['productos', '/productos'],
        ['combustibles', '/productos/combustibles'],
        ['categorias', '/productos/categorias-grupos'],
    ];

    return pages.find(([module]) => allowed(user, module))?.[1] || '/inicio';
}
