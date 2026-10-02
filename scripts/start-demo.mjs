import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const webPort = process.env.PORT || '10000';
if (!/^\d+$/.test(webPort) || Number(webPort) < 1024 || Number(webPort) > 65535 || webPort === '3000') {
  throw new Error('PORT debe ser un puerto público válido distinto de 3000.');
}
const origin = process.env.WEB_ORIGIN || process.env.RENDER_EXTERNAL_URL;
if (!origin) throw new Error('Configure WEB_ORIGIN o RENDER_EXTERNAL_URL.');
const env = { ...process.env, WEB_ORIGIN: origin, PORT: '3000', HOST: '127.0.0.1', APACHE_HTTP_PORT: webPort };
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  const deadline = setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
  }, 8000);
  deadline.unref();
}
process.on('SIGTERM', () => stop());
process.on('SIGINT', () => stop());
function launch(command, args) {
  const child = spawn(command, args, { env, stdio: 'inherit' });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}
async function database(command) {
  await new Promise((resolve, reject) => {
    const child = launch(process.execPath, ['apps/api/dist/infrastructure/database/cli.js', command]);
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Falló ${command}.`)));
  });
}
try {
  await database('migrate');
  if (!stopping) await database('seed');
  if (!stopping) {
    const api = launch(process.execPath, ['--max-old-space-size=256', 'apps/api/dist/main.js']);
    api.once('error', () => stop(1));
    api.once('exit', code => { if (!stopping) stop(code || 1); });
    let ready = false;
    for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
      try {
        ready = (await fetch('http://127.0.0.1:3000/api/health', { signal: AbortSignal.timeout(2000) })).ok;
      } catch { /* Wait for the API to start. */ }
      if (ready) break;
      await sleep(1000);
    }
    if (!ready) throw new Error('La API no inició correctamente.');
    const apache = launch('/usr/sbin/apache2ctl', ['-D', 'FOREGROUND']);
    apache.once('error', () => stop(1));
    apache.once('exit', code => { if (!stopping) stop(code || 1); });
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
