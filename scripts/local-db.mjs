import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';
dotenv.config();
if (!process.env.LOCAL_DB_PASSWORD) throw new Error('Ejecuta primero npm run setup:local.');
mkdirSync('.local', { recursive: true });
const dir = resolve('.local/postgres15');
const probe = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 2000 });
try {
  await probe.connect();
  const current = await probe.query('SHOW data_directory');
  await probe.end();
  if (resolve(current.rows[0].data_directory).toLowerCase() === dir.toLowerCase()) {
    console.log('La base local de este proyecto ya está ejecutándose.');
    process.exit(0);
  }
  throw new Error('DATABASE_URL apunta a otra base de datos. No se modificó esa instancia.');
} catch (error) {
  await probe.end().catch(() => {});
  if (String(error?.message).includes('otra base')) throw error;
}
const pg = new EmbeddedPostgres({
  databaseDir: dir, user: 'surtidor', password: process.env.LOCAL_DB_PASSWORD,
  port: Number(process.env.LOCAL_DB_PORT || 54329), persistent: true,
  authMethod: 'scram-sha-256', initdbFlags: ['--encoding=UTF8', '--locale=C'],
  postgresFlags: ['-c', 'listen_addresses=127.0.0.1', '-c', 'timezone=UTC'],
  onLog: () => {}, onError: message => { if (String(message).includes('FATAL')) console.error(String(message)); },
});
let started = false;
async function stop() { if (started) { started = false; await pg.stop(); } process.exit(0); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  if (!existsSync(resolve(dir, 'PG_VERSION'))) await pg.initialise();
  await pg.start(); started = true;
  const client = pg.getPgClient();
  await client.connect();
  const result = await client.query("SELECT 1 FROM pg_database WHERE datname='surtidor'");
  if (!result.rowCount) await client.query('CREATE DATABASE surtidor');
  const version = await client.query('SHOW server_version');
  console.log(`PostgreSQL ${version.rows[0].server_version} listo en 127.0.0.1:${process.env.LOCAL_DB_PORT || 54329}. Datos: .local/postgres15`);
  await client.end();
  setInterval(() => {}, 60000);
} catch (error) {
  console.error(error?.message || 'No se pudo iniciar PostgreSQL. Revisa si el puerto o la carpeta de datos ya están en uso.');
  if (started) await pg.stop();
  process.exitCode = 1;
}
