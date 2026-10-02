import assert from 'node:assert/strict';
import { test } from 'node:test';
import pg from 'pg';
import { ApiClient, expected, fixtureCredentials } from './client.mjs';

test('La mutación y su bitácora se revierten juntas si falla la auditoría', async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url && /^\/surtidor_test_\d+$/.test(new URL(url).pathname), 'Esta prueba requiere la base aislada del runner.');
  const db = new pg.Client({ connectionString: url });
  await db.connect();
  const client = new ApiClient();
  const credentials = fixtureCredentials('ATI');
  expected(await client.login(credentials.correo, credentials.contrasena), 200);
  const name = `Rollback ${Date.now()}`;
  try {
    await db.query(`CREATE FUNCTION test_reject_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.accion='roles.crear' THEN RAISE EXCEPTION 'Simulated audit failure'; END IF; RETURN NEW; END $$`);
    await db.query('CREATE TRIGGER test_reject_audit BEFORE INSERT ON bitacora FOR EACH ROW EXECUTE FUNCTION test_reject_audit()');
    expected(await client.request('POST', '/roles', { nombre: name, permisoIds: [] }), 500);
    const { rows } = await db.query('SELECT count(*)::int AS total FROM rol WHERE nombre=$1', [name]);
    assert.equal(rows[0].total, 0, 'No debe persistir el rol sin su evento');
  } finally {
    await db.query('DROP TRIGGER IF EXISTS test_reject_audit ON bitacora');
    await db.query('DROP FUNCTION IF EXISTS test_reject_audit()');
    await db.end();
  }
});
