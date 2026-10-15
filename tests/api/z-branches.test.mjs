import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, expected, fixtureCredentials } from './client.mjs';

test('CU15: sucursales, actores, concurrencia y baja sin perder relaciones', async t => {
  const ati = new ApiClient(), asu = new ApiClient();
  for (const [client, actor] of [[ati, 'ATI'], [asu, 'ASU']]) {
    const credentials = fixtureCredentials(actor);
    expected(await client.login(credentials.correo, credentials.contrasena), 200);
  }
  const suffix = String(Date.now());
  const data = { nombre: 'CU15 ' + suffix, direccion: 'Avenida principal 123', telefono: '+591 70000001', correo: 'sucursal@example.test' };
  let branch;
  await t.test('Validación, creación, normalización, consulta y búsqueda', async () => {
    expected(await ati.request('POST', '/sucursales', { ...data, nombre: '  ' }), 400);
    expected(await ati.request('POST', '/sucursales', { ...data, correo: 'incorrecto' }), 400);
    expected(await ati.request('POST', '/sucursales', { ...data, telefono: 'abc' }), 400);
    expected(await ati.request('POST', '/sucursales', { ...data, empresaId: 999 }), 400);
    expected(await ati.request('POST', '/sucursales', data, { csrf: false }), 403);
    branch = expected(await ati.request('POST', '/sucursales', { ...data, nombre: ' ' + data.nombre + ' ', correo: 'SUCURSAL@example.test' }), 201);
    assert.equal(branch.nombre, data.nombre);
    assert.equal(branch.correo, data.correo);
    assert.equal(branch.empresaId, 1);
    assert.equal(branch.activo, true);
    assert.equal(expected(await ati.request('GET', '/sucursales/' + branch.id), 200).nombre, data.nombre);
    assert.equal(expected(await ati.request('GET', '/sucursales/gestion?q=' + suffix), 200).total, 1);
    expected(await ati.request('PATCH', '/sucursales/' + branch.id, { direccion: null }), 400);
    expected(await ati.request('GET', '/sucursales/99999999'), 404);
    expected(await ati.request('GET', '/sucursales/gestion?page=0'), 400);
    expected(await ati.request('GET', '/sucursales/gestion?activo=invalid'), 400);
  });
  await t.test('Duplicados insensibles a mayúsculas, incluso con peticiones concurrentes', async () => {
    expected(await ati.request('POST', '/sucursales', { ...data, nombre: data.nombre.toLowerCase() }), 409);
    const same = { ...data, nombre: data.nombre + ' concurrente' };
    const results = await Promise.all([ati.request('POST', '/sucursales', same), ati.request('POST', '/sucursales', same)]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const other = results.find(r => r.status === 201).data;
    expected(await ati.request('PATCH', '/sucursales/' + other.id, { nombre: branch.nombre }), 409);
    expected(await ati.request('PATCH', '/sucursales/' + branch.id, { direccion: 'Dirección actualizada' }), 200);
    assert.equal(expected(await ati.request('GET', '/sucursales/' + branch.id), 200).direccion, 'Dirección actualizada');
  });
  await t.test('ATI, GG, GS y ASU autorizados; Empleado y rol de consulta sin escritura', async () => {
    const roles = expected(await ati.request('GET', '/roles/opciones'), 200);
    const readPermission = expected(await asu.request('POST', '/permisos', { nombre: 'Consultar sucursales ' + suffix, descripcion: 'Solo lectura', modulo: 'sucursales', accion: 'ver' }), 201);
    const readRole = expected(await ati.request('POST', '/roles', { nombre: 'Lector sucursales ' + suffix, permisoIds: [readPermission.id] }), 201);
    for (const [i, code] of ['GG', 'GS', 'E', 'READ'].entries()) {
      const ci = 'B' + suffix + i;
      const password = 'Prueba#Cu15Segura9';
      const user = expected(await ati.request('POST', '/usuarios', { ci, nombre: 'Actor CU15 ' + code, correo: ci + '@example.test', telefono: '70000001', sexo: 'M', domicilio: 'Calle 1', contrasena: password, rolId: code === 'READ' ? readRole.id : roles.find(r => r.codigo === code).id, sucursalId: branch.id }), 201);
      const client = new ApiClient();
      expected(await client.login(user.correo, password), 200);
      expected(await client.request('GET', '/sucursales/gestion'), code === 'E' ? 403 : 200);
      const allowed = ['GG', 'GS'].includes(code);
      expected(await client.request('POST', '/sucursales', { ...data, nombre: data.nombre + code }), allowed ? 201 : 403);
      expected(await client.request('PATCH', '/sucursales/' + branch.id, { telefono: '70000002' }), allowed ? 200 : 403);
      if (!allowed) expected(await client.request('POST', '/sucursales/' + branch.id + '/deshabilitar', {}), 403);
      expected(await client.request('POST', '/auth/logout', {}), 204);
    }
    expected(await asu.request('PATCH', '/sucursales/' + branch.id, { telefono: '70000003' }), 200);
  });
  await t.test('Baja lógica, relaciones conservadas, exclusión de nuevas asignaciones y bitácora', async () => {
    const { Client } = await import('pg');
    const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await db.connect();
    try {
      const category = await db.query('SELECT id FROM categoria LIMIT 1');
      const product = expected(await ati.request('POST', '/productos', { nombre: 'Producto CU15 ' + suffix, precioVenta: 1, idCategoria: category.rows[0].id, idSucursal: branch.id }), 201);
      const before = await db.query('SELECT count(*)::int AS n FROM usuario WHERE id_sucursal=$1', [branch.id]);
      assert.ok(before.rows[0].n > 0);
      assert.equal(expected(await ati.request('POST', '/sucursales/' + branch.id + '/deshabilitar', {}), 200).activo, false);
      assert.equal(expected(await ati.request('GET', '/sucursales/' + branch.id), 200).activo, false);
      assert.ok(!expected(await ati.request('GET', '/sucursales'), 200).some(b => b.id === branch.id));
      const disabled = expected(await ati.request('GET', '/sucursales/gestion?activo=false&q=' + suffix), 200);
      assert.ok(disabled.items.some(b => b.id === branch.id));
      assert.equal((await db.query('SELECT count(*)::int AS n FROM usuario WHERE id_sucursal=$1', [branch.id])).rows[0].n, before.rows[0].n);
      assert.equal((await db.query('SELECT id_sucursal FROM producto WHERE id=$1', [product.id])).rows[0].id_sucursal, branch.id);
      expected(await ati.request('POST', '/productos', { nombre: 'Producto bloqueado ' + suffix, precioVenta: 1, idCategoria: category.rows[0].id, idSucursal: branch.id }), 400);
      expected(await ati.request('PATCH', '/productos/' + product.id, { precioVenta: 2, idSucursal: branch.id }), 200);
      const assignedUser = (await db.query('SELECT ci FROM usuario WHERE id_sucursal=$1 LIMIT 1', [branch.id])).rows[0];
      expected(await ati.request('PATCH', '/usuarios/' + assignedUser.ci, { telefono: '70000004', sucursalId: branch.id }), 200);
      expected(await ati.request('POST', '/sucursales', data), 409);
      const roles = expected(await ati.request('GET', '/roles/opciones'), 200);
      expected(await ati.request('POST', '/usuarios', { ci: 'B' + suffix + '9', nombre: 'Sucursal inactiva', correo: 'inactiva' + suffix + '@example.test', telefono: '70000001', sexo: 'M', domicilio: 'Calle 1', contrasena: 'Prueba#Cu15Segura9', rolId: roles.find(r => r.codigo === 'E').id, sucursalId: branch.id }), 400);
      for (const action of ['crear', 'editar', 'deshabilitar']) {
        assert.ok(expected(await asu.request('GET', '/bitacora?accion=sucursales.' + action), 200).total > 0);
      }
    } finally { await db.end(); }
  });
});
