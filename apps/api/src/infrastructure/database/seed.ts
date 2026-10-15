import { DataSource } from 'typeorm';
import { hashPassword,validPassword } from '../../modules/security/auth/infrastructure/password';
import { requiredEnv } from '../config';

const roles = [['ASU', 'Administrador Super Usuario'], ['ATI', 'Administrador TI'],
  ['GG', 'Gerente General'], ['GS', 'Gerente de Sucursal'], ['E', 'Empleado']];
const permissions = [
  ['sucursales.gestionar', 'Gestionar sucursales', 'sucursales', 'gestionar', false],
  ['usuarios.gestionar', 'Gestionar usuarios', 'usuarios', 'gestionar', false],
  ['roles.gestionar', 'Gestionar roles', 'roles', 'gestionar', false],
  ['permisos.gestionar', 'Gestionar permisos', 'permisos', 'gestionar', true],
  ['empresa.gestionar', 'Gestionar empresa', 'empresa', 'gestionar', false],
  ['bitacora.ver', 'Consultar bitácora', 'bitacora', 'ver', true],
  ['bitacora.exportar', 'Exportar bitácora', 'bitacora', 'exportar', true],
  ['bitacora.archivar', 'Archivar bitácora', 'bitacora', 'archivar', true],
  ['productos.gestionar', 'Gestionar productos', 'productos', 'gestionar', false],
  ['combustibles.gestionar', 'Gestionar combustible', 'combustibles', 'gestionar', false],
  ['categorias.gestionar', 'Gestionar categorías', 'categorias', 'gestionar', false],
  ['grupos.gestionar', 'Gestionar grupos', 'grupos', 'gestionar', false],
  ['modulos.gestionar', 'Gestionar módulos', 'modulos', 'gestionar', true],
];
export async function seed(db: DataSource): Promise<void> {
  await db.transaction(async em => {
    await em.query('SELECT pg_advisory_xact_lock(1001)');
    for (const [code, name] of roles) {
      await em.query('INSERT INTO rol(codigo,nombre) VALUES($1,$2) ON CONFLICT(codigo) DO NOTHING', [code, name]);
    }
    for (const [code, name, module, action, reserved] of permissions) {
      await em.query(`INSERT INTO permiso(codigo,nombre,descripcion,modulo,accion,reservado)
        VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(codigo) DO NOTHING`,
      [code, name, `Permite ${String(name).toLocaleLowerCase('es')}.`, module, action, reserved]);
    }
    // Ensure Cycle 2 permissions are assigned to standard roles
    const cycle2Assignments: Record<string, string[]> = {
      ASU: ['modulos.gestionar'],
      ATI: ['productos.gestionar', 'combustibles.gestionar', 'categorias.gestionar', 'grupos.gestionar', 'sucursales.gestionar'],
      GG: ['productos.gestionar', 'combustibles.gestionar', 'categorias.gestionar', 'grupos.gestionar', 'sucursales.gestionar'],
      GS: ['sucursales.gestionar'],
    };
    for (const [role, codes] of Object.entries(cycle2Assignments)) {
      await em.query(`INSERT INTO permiso_rol(id_rol,id_permiso)
        SELECT r.id,p.id FROM rol r CROSS JOIN permiso p WHERE r.codigo=$1 AND p.codigo=ANY($2)
        ON CONFLICT DO NOTHING`, [role, codes]);
    }


    // Default System Modules (CU20)
    const defaultModules = [
      ['seguridad', 'Gestión de Usuarios y Seguridad', 'Control de acceso, usuarios, roles y permisos.'],
      ['empresa', 'Gestión de Empresa', 'Datos de la empresa, sucursales y bitácora de auditoría.'],
      ['inventario', 'Gestión de Inventario', 'Control de productos, combustibles, categorías y grupos.'],
      ['compras', 'Gestión de Compras', 'Órdenes de compra, abastecimiento y proveedores.'],
      ['ventas', 'Gestión de Ventas', 'Ventas en pista, dispensadores y promociones.'],
      ['reportes', 'Gestión de Reportes', 'Generación y exportación de reportes operativos.'],
    ];
    for (const [code, name, desc] of defaultModules) {
      await em.query(`INSERT INTO modulo_sistema(codigo, nombre, descripcion, activo)
        VALUES($1, $2, $3, true) ON CONFLICT (lower(codigo)) DO NOTHING`, [code, name, desc]);
    }

    // Default Categories & Groups (CU8)
    await em.query(`INSERT INTO categoria(id, nombre, descripcion, imagen_url, activo)
      VALUES (1, 'Combustibles', 'Combustibles y carburantes para vehículos', '', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO categoria(id, nombre, descripcion, imagen_url, activo)
      VALUES (2, 'Lubricantes', 'Aceites de motor y fluidos hidráulicos', '', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO categoria(id, nombre, descripcion, imagen_url, activo)
      VALUES (3, 'Accesorios', 'Accesorios y repuestos varios', '', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`SELECT setval(pg_get_serial_sequence('categoria', 'id'), coalesce(max(id), 1)) FROM categoria`);

    await em.query(`INSERT INTO grupo(id, nombre, descripcion, activo)
      VALUES (1, 'Líquidos', 'Fluidos y carburantes a granel', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO grupo(id, nombre, descripcion, activo)
      VALUES (2, 'Aditivos', 'Aditivos y complementos de rendimiento', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`SELECT setval(pg_get_serial_sequence('grupo', 'id'), coalesce(max(id), 1)) FROM grupo`);

    // Default Fuels (CU6)
    await em.query(`INSERT INTO combustible(id, tipo, octanaje, nombre, descripcion, esta_activo)
      VALUES (1, 'gasolina', 95, 'Gasolina premium', 'Gasolina especial premium de 95 octanos', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO combustible(id, tipo, octanaje, nombre, descripcion, esta_activo)
      VALUES (2, 'gasolina', 85, 'Gasolina regular', 'Gasolina regular estándar de 85 octanos', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO combustible(id, tipo, octanaje, nombre, descripcion, esta_activo)
      VALUES (3, 'diesel', 45, 'Diesel', 'Diesel oil nacional para transporte pesado', true)
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`SELECT setval(pg_get_serial_sequence('combustible', 'id'), coalesce(max(id), 1)) FROM combustible`);

    // Default Products (CU5) matching mockup Page 60
    await em.query(`INSERT INTO producto(id, nombre, stock, stock_minimo, descripcion, precio_venta, precio_compra, iva, url_image, esta_activo, descuento, id_categoria, id_sucursal)
      VALUES (1, 'Gasolina premium', 5000, 500, 'Gasolina especial premium de 95 octanos', 20.00, 18.00, 13.00, '', true, 0.00, 1, (SELECT id FROM sucursal LIMIT 1))
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO producto(id, nombre, stock, stock_minimo, descripcion, precio_venta, precio_compra, iva, url_image, esta_activo, descuento, id_categoria, id_sucursal)
      VALUES (2, 'Gasolina regular', 8000, 1000, 'Gasolina regular estándar', 15.99, 14.00, 13.00, '', true, 0.00, 1, (SELECT id FROM sucursal LIMIT 1))
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`INSERT INTO producto(id, nombre, stock, stock_minimo, descripcion, precio_venta, precio_compra, iva, url_image, esta_activo, descuento, id_categoria, id_sucursal)
      VALUES (3, 'Diesel', 6000, 800, 'Diesel oil nacional', 22.50, 20.00, 13.00, '', true, 0.00, 1, (SELECT id FROM sucursal LIMIT 1))
      ON CONFLICT (id) DO NOTHING`);
    await em.query(`SELECT setval(pg_get_serial_sequence('producto', 'id'), coalesce(max(id), 1)) FROM producto`);

    await em.query(`INSERT INTO grupo_producto(id_grupo, id_producto) VALUES (1, 1), (1, 2), (1, 3) ON CONFLICT DO NOTHING`);

    // Initial assignment only: rerunning seed must not overwrite authorized role changes.
    const existing = await em.query('SELECT 1 FROM usuario LIMIT 1');
    if (!existing.length) {
      const assignments: Record<string, string[]> = {
        ASU: ['permisos.gestionar', 'bitacora.ver', 'bitacora.exportar', 'bitacora.archivar'],
        ATI: ['usuarios.gestionar', 'roles.gestionar', 'empresa.gestionar', 'sucursales.gestionar'], GG: ['empresa.gestionar', 'sucursales.gestionar'], GS: ['sucursales.gestionar'],
      };
      for (const [role, codes] of Object.entries(assignments)) {
        await em.query(`INSERT INTO permiso_rol(id_rol,id_permiso)
          SELECT r.id,p.id FROM rol r CROSS JOIN permiso p WHERE r.codigo=$1 AND p.codigo=ANY($2)
          ON CONFLICT DO NOTHING`, [role, codes]);
      }
      for (const code of ['ASU', 'ATI']) {
        const ci = process.env[`BOOTSTRAP_${code}_CI`]?.trim() || `BOOTSTRAP-${code}`;
        const name = process.env[`BOOTSTRAP_${code}_NAME`]?.trim() || (code === 'ASU' ? 'Administrador Super Usuario' : 'Administrador TI');
        const email = requiredEnv(`BOOTSTRAP_${code}_EMAIL`).trim().toLowerCase();
        const password = requiredEnv(`BOOTSTRAP_${code}_PASSWORD`);
        if (!validPassword(password)) throw new Error(`BOOTSTRAP_${code}_PASSWORD no cumple la política.`);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`BOOTSTRAP_${code}_EMAIL no es válido.`);
        const [{ id }] = await em.query('SELECT id FROM rol WHERE codigo=$1', [code]);
        await em.query(`INSERT INTO usuario(ci,nombre,correo,telefono,sexo,domicilio,password_hash,id_rol,cargo)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [ci, name, email,
          '00000000', 'No especificado', 'Actualizar domicilio', await hashPassword(password), id, 'Administración']);
      }
    }
  });
}
