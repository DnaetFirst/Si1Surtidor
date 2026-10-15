export const CAPABILITIES = [
    ...['usuarios', 'roles', 'permisos'].flatMap(modulo => ['gestionar', 'ver', 'crear', 'editar', 'deshabilitar', ...(modulo === 'permisos' ? ['exportar'] : [])].map(accion => ({ modulo, accion }))),
    ...['gestionar', 'ver', 'crear', 'editar'].map(accion => ({ modulo: 'empresa', accion })),
    ...['ver', 'exportar', 'archivar'].map(accion => ({ modulo: 'bitacora', accion })),
    ...['productos', 'combustibles', 'categorias', 'grupos'].flatMap(modulo => ['gestionar', 'ver', 'crear', 'editar', 'eliminar'].map(accion => ({ modulo, accion }))),
    ...['gestionar', 'ver', 'crear', 'editar', 'eliminar'].map(accion => ({ modulo: 'modulos', accion })),
].map(capability => ({ ...capability, codigo: `${capability.modulo}.${capability.accion}`, reservado: ['permisos', 'bitacora', 'modulos'].includes(capability.modulo) }));

