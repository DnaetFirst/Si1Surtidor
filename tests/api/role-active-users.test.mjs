import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, expected, fixtureCredentials } from './client.mjs';

test('Roles count only active users and allow disabling after the last active user is disabled', async () => {
  const client = new ApiClient();
  const credentials = fixtureCredentials('ATI');
  expected(await client.login(credentials.correo, credentials.contrasena), 200);
  const suffix = Date.now().toString();
  const role = expected(await client.request('POST', '/roles', { nombre: `Active-count ${suffix}`, permisoIds: [] }), 201);
  for (const ending of ['1', '2']) {
    expected(await client.request('POST', '/usuarios', {
      ci: suffix + ending, nombre: `Count user ${ending}`, correo: `count.${suffix}.${ending}@example.test`,
      telefono: '70000000', sexo: 'No especificado', domicilio: 'Test address', rolId: role.id,
      contrasena: 'Testing#Count9', sucursalId: null,
    }), 201);
  }
  assert.equal(expected(await client.request('GET', `/roles/${role.id}`), 200).usuariosCount, 2);
  expected(await client.request('POST', `/usuarios/${suffix}1/deshabilitar`, {}), 200);
  assert.equal(expected(await client.request('GET', `/roles/${role.id}`), 200).usuariosCount, 1);
  expected(await client.request('POST', `/roles/${role.id}/deshabilitar`, {}), 409);
  expected(await client.request('POST', `/usuarios/${suffix}2/deshabilitar`, {}), 200);
  const list = expected(await client.request('GET', `/roles?q=${encodeURIComponent(role.nombre)}`), 200);
  assert.equal(list.items.find(item => item.id === role.id).usuariosCount, 0);
  expected(await client.request('POST', `/roles/${role.id}/deshabilitar`, {}), 200);
  assert.equal(expected(await client.request('GET', `/roles/${role.id}`), 200).activo, false);
  assert.equal(expected(await client.request('GET', `/usuarios/${suffix}1`), 200).rol.id, role.id);
});
