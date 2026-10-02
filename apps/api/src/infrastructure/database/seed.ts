import { DataSource } from 'typeorm';
import { hashPassword,validPassword } from '../../modules/security/auth/infrastructure/password';
import { requiredEnv } from '../config';

const roles = [['ASU', 'Administrador Super Usuario'], ['ATI', 'Administrador TI'],
  ['GG', 'Gerente General'], ['GS', 'Gerente de Sucursal'], ['E', 'Empleado']];
const permissions = [
  ['usuarios.gestionar', 'Gestionar usuarios', 'usuarios', 'gestionar', false],
  ['roles.gestionar', 'Gestionar roles', 'roles', 'gestionar', false],
  ['permisos.gestionar', 'Gestionar permisos', 'permisos', 'gestionar', true],
  ['empresa.gestionar', 'Gestionar empresa', 'empresa', 'gestionar', false],
  ['bitacora.ver', 'Consultar bitácora', 'bitacora', 'ver', true],
  ['bitacora.exportar', 'Exportar bitácora', 'bitacora', 'exportar', true],
  ['bitacora.archivar', 'Archivar bitácora', 'bitacora', 'archivar', true],
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
    // Initial assignment only: rerunning seed must not overwrite authorized role changes.
    const existing = await em.query('SELECT 1 FROM usuario LIMIT 1');
    if (!existing.length) {
      const assignments: Record<string, string[]> = {
        ASU: ['permisos.gestionar', 'bitacora.ver', 'bitacora.exportar', 'bitacora.archivar'],
        ATI: ['usuarios.gestionar', 'roles.gestionar', 'empresa.gestionar'], GG: ['empresa.gestionar'],
      };
      for (const [role, codes] of Object.entries(assignments)) {
        await em.query(`INSERT INTO permiso_rol(id_rol,id_permiso)
          SELECT r.id,p.id FROM rol r CROSS JOIN permiso p WHERE r.codigo=$1 AND p.codigo=ANY($2)
          ON CONFLICT DO NOTHING`, [role, codes]);
      }
      for (const code of ['ASU', 'ATI']) {
        const email = requiredEnv(`BOOTSTRAP_${code}_EMAIL`).trim().toLowerCase();
        const password = requiredEnv(`BOOTSTRAP_${code}_PASSWORD`);
        if (!validPassword(password)) throw new Error(`BOOTSTRAP_${code}_PASSWORD no cumple la política.`);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`BOOTSTRAP_${code}_EMAIL no es válido.`);
        const [{ id }] = await em.query('SELECT id FROM rol WHERE codigo=$1', [code]);
        await em.query(`INSERT INTO usuario(ci,nombre,correo,telefono,sexo,domicilio,password_hash,id_rol,cargo)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [`BOOTSTRAP-${code}`, code === 'ASU' ? 'Administrador Super Usuario' : 'Administrador TI', email,
          '00000000', 'No especificado', 'Actualizar domicilio', await hashPassword(password), id, 'Administración']);
      }
    }
  });
}
