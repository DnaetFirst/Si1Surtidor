import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

if (existsSync('.env')) {
  console.log('.env ya existe; se conservó sin cambios.');
  process.exit(0);
}
mkdirSync('.local', { recursive: true });
const asu = `Asu!8${randomBytes(12).toString('hex')}`;
const ati = `Ati!8${randomBytes(12).toString('hex')}`;
const dbPassword = randomBytes(24).toString('hex');
const url = `postgresql://surtidor:${dbPassword}@127.0.0.1:54329/surtidor`;
writeFileSync('.env', [
  `DATABASE_URL=${url}`, `TEST_DATABASE_URL=${url}`, `LOCAL_DB_PASSWORD=${dbPassword}`,
  'LOCAL_DB_PORT=54329', `JWT_SECRET=${randomBytes(48).toString('hex')}`,
  `CSRF_SECRET=${randomBytes(48).toString('hex')}`, 'PORT=3000',
  'WEB_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080',
  'COOKIE_SECURE=false', 'TRUST_PROXY=false',
  'BOOTSTRAP_ASU_EMAIL=asu@migasolinera.local', `BOOTSTRAP_ASU_PASSWORD=${asu}`,
  'BOOTSTRAP_ATI_EMAIL=ati@migasolinera.local', `BOOTSTRAP_ATI_PASSWORD=${ati}`,
  'TEST_ASU_EMAIL=asu@migasolinera.local', `TEST_ASU_PASSWORD=${asu}`,
  'TEST_ATI_EMAIL=ati@migasolinera.local', `TEST_ATI_PASSWORD=${ati}`,
  'TEST_API_URL=http://127.0.0.1:3000/api', 'TEST_WEB_URL=http://127.0.0.1:5173',
  'POSTGRES_USER=surtidor', `POSTGRES_PASSWORD=${dbPassword}`, 'POSTGRES_DB=surtidor', '',
].join('\n'), { mode: 0o600 });
writeFileSync('.local/ACCESO.txt', `MI GASOLINERA — ACCESO LOCAL\n\nhttp://localhost:5173\n\nAdministrador Super Usuario\nCorreo: asu@migasolinera.local\nContraseña: ${asu}\n\nAdministrador TI\nCorreo: ati@migasolinera.local\nContraseña: ${ati}\n\nCredenciales generadas solo para esta instalación; no compartir ni publicar este archivo.\n`, { mode: 0o600 });
console.log(`Entorno local creado. Credenciales guardadas en ${resolve('.local/ACCESO.txt')}.`);
