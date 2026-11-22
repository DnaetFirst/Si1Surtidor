import { SessionUser } from './models';

export function allowed(
    user: SessionUser | null,
    module: string,
    action = 'ver'
) {
    if (!user) return false;
    if (user.rol?.codigo === 'ASU') return true;
    return (
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
        ['salidas', '/inventario/salidas'],
        ['proveedores', '/compras/proveedores'],
        ['ordenes', '/compras/ordenes'],
        ['compras', '/compras'],
        ['ventas', '/ventas'],
        ['dispensadores', '/ventas/dispensadores'],
        ['descuentos', '/ventas/descuentos'],
        ['reportes', '/reportes'],
    ];

    return pages.find(([module]) => allowed(user, module))?.[1] || '/inicio';
}
