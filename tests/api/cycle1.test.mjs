import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, accepted, expected, fixtureCredentials } from './client.mjs';

const suffix = `${Date.now()}`;
const password = `Prueba!${suffix}aA`;
const newPassword = `Nueva!${suffix}bB`;
const startedAt = new Date(Date.now() - 1000).toISOString();
const userPayload = (ci, rolId, extra = {}) => ({
  ci, nombre: `Prueba ${ci}`, correo: `prueba.${ci}@example.test`, telefono: '70000000',
  sexo: 'M', domicilio: 'Dirección de pruebas', cargo: '', sucursalId: null, rolId,
  contrasena: password, ...extra,
});
const identity = data => data.user ?? data;

test('Ciclo 1: integración HTTP con PostgreSQL', { timeout: 120_000 }, async t => {
  const asu = new ApiClient();
  const ati = new ApiClient();
  const anonymous = new ApiClient();
  const asuCredentials = fixtureCredentials('ASU');
  const atiCredentials = fixtureCredentials('ATI');
  let asuUser, atiUser, roles, assignedRole, emptyRole, testUser, testSession, newPermission;
  let createdPermission = false;

  await t.test('Autenticación, cookies HttpOnly y validación CSRF', async () => {
    expected(await anonymous.request('GET', '/auth/me'), 401);
    expected(await anonymous.request('POST', '/auth/login', atiCredentials), 403, 'login sin CSRF');
    const loginAsu = await asu.login(asuCredentials.correo, asuCredentials.contrasena);
    asuUser = identity(accepted(loginAsu, [200, 201], 'login ASU'));
    const loginAti = await ati.login(atiCredentials.correo, atiCredentials.contrasena);
    atiUser = identity(accepted(loginAti, [200, 201], 'login ATI'));
    assert.ok(loginAti.setCookies.some(value => /httponly/i.test(value)), 'La sesión debe usar cookie HttpOnly');
    const accessPayload = JSON.parse(Buffer.from(ati.cookies.get('access_token').split('.')[1], 'base64url').toString());
    assert.equal(accessPayload.exp - accessPayload.iat, 900, 'JWT de acceso válido durante 15 minutos');
    assert.equal(accessPayload.sub, atiUser.ci);
    assert.ok(atiUser.ci && Array.isArray(atiUser.permisos));
    assert.ok(asuUser.ci && Array.isArray(asuUser.permisos));
    assert.doesNotMatch(JSON.stringify(atiUser), /passwordHash|contrasenaHash|refreshToken|"contrasena"/i);
    expected(await ati.request('POST', '/auth/logout', {}, { csrf: false }), 403, 'mutación sin CSRF');
    expected(await ati.request('GET', '/auth/me'), 200, 'la prueba CSRF no cerró la sesión');
    expected(await ati.request('POST', '/auth/logout', {}, { headers: { 'X-CSRF-Token': 'token-invalido' } }), 403);
  });

  await t.test('Matriz de actores y consulta de roles/sucursales', async () => {
    roles = expected(await ati.request('GET', '/roles/opciones'), 200);
    for (const code of ['ATI', 'GG', 'GS', 'E']) assert.ok(roles.some(role => role.codigo === code), `Rol ${code}`);
    expected(await ati.request('GET', '/usuarios'), 200);
    expected(await ati.request('GET', '/sucursales'), 200);
    expected(await ati.request('GET', '/bitacora'), 403);
    expected(await ati.request('GET', '/permisos'), 403);
    expected(await asu.request('GET', '/permisos'), 200);
    expected(await asu.request('GET', '/bitacora'), 200);
    expected(await asu.request('GET', '/usuarios'), 403);
  });

  await t.test('ATI no modifica ASU ni concede su rol', async () => {
    const listado = expected(await ati.request('GET', `/usuarios?q=${encodeURIComponent(asuCredentials.correo)}`), 200);
    assert.ok(listado.items.some(user => user.ci === asuUser.ci), 'ATI puede consultar los datos básicos ASU');
    expected(await ati.request('PATCH', `/usuarios/${asuUser.ci}`, { nombre: 'No permitido' }), 403);
    expected(await ati.request('POST', `/usuarios/${asuUser.ci}/deshabilitar`, {}), 403);
    const asuRole = asuUser.rol;
    expected(await ati.request('POST', '/usuarios', userPayload(`${suffix}1`, asuRole.id)), 403);
    expected(await ati.request('PATCH', `/roles/${asuRole.id}`, { nombre: 'No permitido' }), 403);
    const permisos = expected(await asu.request('GET', '/permisos?pageSize=100'), 200).items;
    const asignables = expected(await ati.request('GET', '/permisos/asignables'), 200);
    for (const permiso of permisos.filter(item => !item.reservado)) assert.ok(asignables.some(item => item.id === permiso.id), `Permiso visible para ATI: ${permiso.codigo}`);
    assert.ok(asignables.every(permiso => !permiso.reservado), 'ATI no ve permisos reservados');
    const reserved = permisos.find(permiso => permiso.modulo === 'bitacora');
    assert.ok(reserved);
    expected(await ati.request('POST', '/roles', { nombre: `Escalada ${suffix}`, permisoIds: [reserved.id] }), 403);
  });

  await t.test('Último ATI conserva rol, estado y capacidades administrativas', async () => {
    const employeeRole = roles.find(role => role.codigo === 'E');
    expected(await ati.request('POST', `/usuarios/${atiUser.ci}/deshabilitar`, {}), 409);
    expected(await ati.request('PATCH', `/usuarios/${atiUser.ci}`, { rolId: employeeRole.id }), 409);
    expected(await ati.request('PATCH', `/roles/${atiUser.rol.id}`, { permisoIds: [] }), 409);
    expected(await ati.request('GET', '/usuarios'), 200);
  });

  await t.test('Roles: alta, duplicado, edición y baja lógica sin asignaciones', async () => {
    emptyRole = expected(await ati.request('POST', '/roles', { nombre: `Temporal ${suffix}`, permisoIds: [] }), 201);
    expected(await ati.request('POST', '/roles', { nombre: `Temporal ${suffix}`, permisoIds: [] }), 409);
    expected(await ati.request('PATCH', `/roles/${emptyRole.id}`, { nombre: `Temporal editado ${suffix}` }), 200);
    accepted(await ati.request('POST', `/roles/${emptyRole.id}/deshabilitar`, {}), [200, 201]);
    assignedRole = expected(await ati.request('POST', '/roles', { nombre: `Asignado ${suffix}`, permisoIds: [] }), 201);
  });

  await t.test('Usuarios: validación, persistencia, unicidad y consulta por CI', async () => {
    const ci = `${suffix}2`;
    expected(await ati.request('POST', '/usuarios', userPayload(`${suffix}0`, assignedRole.id, { contrasena: 'debil' })), 400);
    testUser = expected(await ati.request('POST', '/usuarios', userPayload(ci, assignedRole.id)), 201);
    const fetched = expected(await ati.request('GET', `/usuarios/${ci}`), 200);
    assert.equal(fetched.correo, testUser.correo);
    assert.equal(fetched.sucursalId ?? fetched.sucursal?.id ?? null, null);
    expected(await ati.request('POST', '/usuarios', userPayload(ci, assignedRole.id, { correo: `otro.${suffix}@example.test` })), 409);
    expected(await ati.request('POST', '/usuarios', userPayload(`${suffix}3`, assignedRole.id, { correo: testUser.correo })), 409);
    expected(await ati.request('PATCH', `/usuarios/${ci}`, { nombre: `Editado ${suffix}`, contrasena: '' }), 200);
    testSession = new ApiClient();
    accepted(await testSession.login(testUser.correo, password), [200, 201], 'contraseña vacía conserva valor');
    expected(await testSession.request('GET', '/usuarios'), 403);
    expected(await ati.request('POST', `/roles/${assignedRole.id}/deshabilitar`, {}), 409, 'rol asignado');
    const concurrent = userPayload(`${suffix}4`, assignedRole.id);
    const results = await Promise.all([ati.request('POST', '/usuarios', concurrent), ati.request('POST', '/usuarios', concurrent)]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409], 'unicidad ante concurrencia');
  });

  await t.test('Permisos granulares: alta, código estable, duplicado y cambios sobre una sesión existente', async () => {
    const capacidades = expected(await asu.request('GET', '/permisos/capacidades'), 200);
    assert.ok(Array.isArray(capacidades) && capacidades.length);
    const existing = expected(await asu.request('GET', '/permisos?pageSize=100'), 200).items;
    const created = await asu.request('POST', '/permisos', { nombre: `Ver usuarios ${suffix}`, descripcion: 'Prueba granular', modulo: 'usuarios', accion: 'ver' });
    if (created.status === 409) {
      newPermission = existing.find(permiso => permiso.codigo === 'usuarios.ver');
      assert.ok(newPermission, 'capacidad ya registrada');
    } else { newPermission = expected(created, 201); createdPermission = true; }
    expected(await asu.request('POST', '/permisos', { nombre: `Duplicado ${suffix}`, descripcion: 'Duplicado', modulo: 'usuarios', accion: 'ver' }), 409);
    expected(await ati.request('PATCH', `/roles/${assignedRole.id}`, { permisoIds: [newPermission.id] }), 200);
    expected(await testSession.request('GET', '/usuarios'), 200, 'la sesión recibe capacidades actuales');
    expected(await asu.request('POST', `/permisos/${newPermission.id}/deshabilitar`, {}), 409, 'permiso asignado');
    const renamed = expected(await asu.request('PATCH', `/permisos/${newPermission.id}`, { nombre: `Renombrado ${suffix}`, descripcion: '=SUM(1,2)' }), 200);
    assert.equal(renamed.codigo, 'usuarios.ver');
    expected(await testSession.request('GET', '/usuarios'), 200, 'renombrar conserva autorización');
    const csv = await asu.request('GET', `/permisos/exportar?q=${encodeURIComponent(`Renombrado ${suffix}`)}`);
    expected(csv, 200);
    assert.match(csv.headers.get('content-type') || '', /csv/i);
    assert.ok(csv.text.includes("'=SUM(1,2)"), 'CSV neutraliza fórmulas');
    expected(await ati.request('PATCH', `/roles/${assignedRole.id}`, { permisoIds: [] }), 200);
    expected(await testSession.request('GET', '/usuarios'), 403, 'la sesión pierde capacidades actuales');
    if (createdPermission) accepted(await asu.request('POST', `/permisos/${newPermission.id}/deshabilitar`, {}), [200, 201]);
    else {
      const original = existing.find(permiso => permiso.id === newPermission.id);
      expected(await asu.request('PATCH', `/permisos/${newPermission.id}`, { nombre: original.nombre, descripcion: original.descripcion }), 200);
    }
  });

  await t.test('Cambio de contraseña y baja revocan sesiones', async () => {
    expected(await ati.request('PATCH', `/usuarios/${testUser.ci}`, { contrasena: newPassword }), 200);
    expected(await testSession.request('GET', '/auth/me'), 401);
    testSession = new ApiClient();
    accepted(await testSession.login(testUser.correo, newPassword), [200, 201]);
    const stale = testSession.clone();
    accepted(await ati.request('POST', `/usuarios/${testUser.ci}/deshabilitar`, {}), [200, 201]);
    expected(await stale.request('GET', '/auth/me'), 401);
    const disabledLogin = new ApiClient();
    accepted(await disabledLogin.login(testUser.correo, newPassword), [401, 403]);
  });

  await t.test('Tercer fallo bloquea durante 15 minutos y el bloqueo persiste', async () => {
    const user = expected(await ati.request('POST', '/usuarios', userPayload(`${suffix}5`, assignedRole.id)), 201);
    const client = new ApiClient();
    for (let index = 0; index < 3; index++) expected(await client.login(user.correo, 'Incorrecta!123'), index === 2 ? 423 : 401);
    const blocked = expected(await client.login(user.correo, password), 423, 'bloqueada incluso con contraseña correcta');
    assert.ok(blocked.retryAfterSeconds > 840 && blocked.retryAfterSeconds <= 900);
    if (process.env.TEST_DATABASE_URL) {
      const { Client } = await import('pg');
      const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
      await db.connect();
      try {
        const { rows: columns } = await db.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND (column_name ILIKE '%bloque%' OR column_name ILIKE '%locked%')");
        assert.equal(columns.length, 1, 'columna persistida de bloqueo identificable');
        const { table_name: table, column_name: column } = columns[0];
        const quoted = value => `"${value.replaceAll('"', '""')}"`;
        const persisted = await db.query(`SELECT ${quoted(column)} AS blocked FROM ${quoted(table)} WHERE ci=$1`, [user.ci]);
        const remaining = new Date(persisted.rows[0].blocked).valueOf() - Date.now();
        assert.ok(remaining > 14 * 60_000 && remaining <= 15 * 60_000 + 5000, 'duración real de 15 minutos');
        await db.query(`UPDATE ${quoted(table)} SET ${quoted(column)}=NOW()-INTERVAL '1 second' WHERE ci=$1`, [user.ci]);
        accepted(await client.login(user.correo, password), [200, 201], 'expiración reinicia bloqueo');
      } finally { await db.end(); }
    } else t.diagnostic('TEST_DATABASE_URL ausente: no se verifica expiración del bloqueo mediante fixture SQL.');
  });

  await t.test('Empresa única y permisos de Gerente General, GS y Empleado', async () => {
    assert.equal(expected(await ati.request('GET', '/empresa'), 200), null, 'Empresa sin registrar se representa con JSON null');
    const current = expected(await ati.request('GET', '/empresa'), 200);
    const data = { nombre: `Empresa prueba ${suffix}`, telefono: '70000001', direccion: 'Avenida pruebas 123', nombrePropietario: 'Propietario prueba', fechaCreacion: '2024-05-11', correo: 'empresa@example.test', nit: `90${suffix}`, logoUrl: '' };
    accepted(await ati.request(current ? 'PATCH' : 'POST', '/empresa', data), [200, 201]);
    expected(await ati.request('POST', '/empresa', data), 409);
    assert.equal(expected(await ati.request('GET', '/empresa'), 200).nombre, data.nombre);
    for (const [index, code] of ['GG', 'GS', 'E'].entries()) {
      const actor = expected(await ati.request('POST', '/usuarios', userPayload(`${suffix}6${index}`, roles.find(role => role.codigo === code).id)), 201);
      const client = new ApiClient();
      const result = identity(accepted(await client.login(actor.correo, password), [200, 201]));
      expected(await client.request('GET', '/empresa'), code === 'GG' ? 200 : 403);
      expected(await client.request('GET', '/bitacora'), 403);
      if (code !== 'GG') assert.equal(result.permisos.length, 0);
    }
  });

  await t.test('Renovación, cierre y revocación de cookies anteriores', async () => {
    const client = new ApiClient();
    accepted(await client.login(atiCredentials.correo, atiCredentials.contrasena), [200, 201]);
    const beforeRefresh = client.clone();
    accepted(await client.request('POST', '/auth/refresh', {}), [200, 201]);
    expected(await beforeRefresh.request('POST', '/auth/refresh', {}), 401, 'token de renovación anterior invalidado');
    const stale = client.clone();
    accepted(await client.request('POST', '/auth/logout', {}), [200, 201, 204]);
    expected(await client.request('GET', '/auth/me'), 401);
    expected(await stale.request('GET', '/auth/me'), 401);
    expected(await stale.request('POST', '/auth/refresh', {}), 401);
    if (process.env.TEST_DATABASE_URL) {
      const expiring = new ApiClient();
      accepted(await expiring.login(atiCredentials.correo, atiCredentials.contrasena), [200, 201]);
      const sid = expiring.cookies.get('refresh_token').split('.')[0];
      const { Client } = await import('pg');
      const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
      await db.connect();
      try {
        const result = await db.query('SELECT expires_at-created_at AS duration, EXTRACT(EPOCH FROM (expires_at-created_at)) AS seconds FROM sesion WHERE id=$1', [sid]);
        assert.ok(Math.abs(Number(result.rows[0].seconds) - 8 * 3600) < 5, 'sesión de ocho horas');
        await db.query("UPDATE sesion SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1", [sid]);
        expected(await expiring.request('GET', '/auth/me'), 401);
        expected(await expiring.request('POST', '/auth/refresh', {}), 401, 'renovación no extiende sesión vencida');
      } finally { await db.end(); }
    }
  });

  await t.test('Cerrar sesión revoca también una renovación concurrente', async () => {
    const current = new ApiClient();
    expected(await current.login(atiCredentials.correo, atiCredentials.contrasena), 200);
    const oldCookies = current.clone();
    expected(await current.request('POST', '/auth/refresh'), 200);
    expected(await oldCookies.request('POST', '/auth/logout'), 204);
    expected(await current.request('GET', '/auth/me'), 401);
    expected(await current.request('POST', '/auth/refresh'), 401);
  });

  await t.test('Bitácora: filtros, exportación completa, archivo sin borrado y eventos inmutables', async () => {
    const hasta = new Date(Date.now() + 1000).toISOString();
    const range = `desde=${encodeURIComponent(startedAt)}&hasta=${encodeURIComponent(hasta)}`;
    const events = expected(await asu.request('GET', `/bitacora?${range}&pageSize=1`), 200);
    assert.ok(events.total > 1 && events.items.length === 1, 'paginación con eventos reales');
    const failures = expected(await asu.request('GET', `/bitacora?${range}&accion=AUTH_FAILURE`), 200);
    assert.ok(failures.total > 0);
    assert.ok(failures.items.every(event => event.accion === 'AUTH_FAILURE'));
    expected(await asu.request('GET', `/bitacora?desde=${encodeURIComponent(hasta)}&hasta=${encodeURIComponent(startedAt)}`), 400);
    const csv = await asu.request('GET', `/bitacora/exportar?${range}`);
    expected(csv, 200);
    assert.match(csv.headers.get('content-type') || '', /csv/i);
    assert.ok(csv.text.split(/\r?\n/).filter(Boolean).length > events.items.length + 1, 'CSV exporta todas las páginas');
    assert.ok(!csv.text.includes(password) && !csv.text.includes(newPassword), 'sin contraseñas');
    assert.doesNotMatch(csv.text, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    accepted(await asu.request('PATCH', `/bitacora/${events.items[0].id}`, { accion: 'Alterada' }), [404, 405]);
    accepted(await asu.request('DELETE', `/bitacora/${events.items[0].id}`), [404, 405]);
    accepted(await asu.request('POST', '/bitacora/archivar', { desde: startedAt, hasta }), [200, 201]);
    const archived = expected(await asu.request('GET', `/bitacora?${range}&archivado=true&pageSize=100`), 200);
    assert.ok(archived.total >= events.total, 'archivo preserva eventos');
    assert.ok(archived.items.some(event => event.id === events.items[0].id));
    expected(await asu.request('GET', `/bitacora/exportar?${range}&archivado=true`), 200);
    expected(await ati.request('POST', '/bitacora/archivar', { desde: startedAt, hasta }), 403);
    if (process.env.TEST_DATABASE_URL) {
      const { Client } = await import('pg');
      const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
      await db.connect();
      try {
        await assert.rejects(db.query("UPDATE bitacora SET accion='Alterada' WHERE id=$1", [events.items[0].id]), /inmutable/i);
        await assert.rejects(db.query('DELETE FROM bitacora WHERE id=$1', [events.items[0].id]), /eliminar/i);
      } finally { await db.end(); }
    }
  });
});
