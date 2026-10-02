import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const root = process.cwd();
const npmCli = process.env.npm_execpath || resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const databaseName = `surtidor_test_${Date.now()}`;
const testUrl = new URL(process.env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const env = { ...process.env, DATABASE_URL: testUrl.toString(), TEST_DATABASE_URL: testUrl.toString(),
  PORT: '3001', WEB_ORIGIN: 'http://127.0.0.1:5174', API_PROXY_TARGET: 'http://127.0.0.1:3001',
  TEST_API_URL: 'http://127.0.0.1:3001/api', TEST_WEB_URL: 'http://127.0.0.1:5174',
  TEST_ASU_EMAIL: process.env.BOOTSTRAP_ASU_EMAIL, TEST_ASU_PASSWORD: process.env.BOOTSTRAP_ASU_PASSWORD,
  TEST_ATI_EMAIL: process.env.BOOTSTRAP_ATI_EMAIL, TEST_ATI_PASSWORD: process.env.BOOTSTRAP_ATI_PASSWORD,
};
function run(args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit', windowsHide: true, ...options });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`El comando terminó con código ${code}.`)));
  });
}
const services = [];
function service(args, name, options = {}) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, ...options });
  let logs = '';
  child.stdout.on('data', chunk => { logs = (logs + chunk).slice(-10000); });
  child.stderr.on('data', chunk => { logs = (logs + chunk).slice(-10000); });
  child.on('error', error => console.error(`${name}: ${error.message}`));
  services.push(child);
  return { child, logs: () => logs };
}
async function ready(url, proc) {
  for (let i=0; i<60; i++) {
    if (proc.child.exitCode !== null) throw new Error(proc.logs());
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await sleep(500);
  }
  throw new Error(`El servicio no inició: ${url}\n${proc.logs()}`);
}
async function stop(child) {
  if (child.exitCode !== null) return;
  await new Promise(resolvePromise => { child.once('exit', resolvePromise); child.kill(); });
}
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let created = false;
let success = false;
const start = new Date();
try {
  await run([npmCli, 'run', 'build', ...(process.argv.includes('--api-only') ? ['-w', '@surtidor/api'] : [])]);
  await run(['--test', 'tests/architecture.test.mjs']);
  await run([npmCli, 'run', 'test:unit', '-w', '@surtidor/api']);
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`); created = true;
  await run(['apps/api/dist/infrastructure/database/cli.js', 'migrate']);
  await run(['apps/api/dist/infrastructure/database/cli.js', 'seed']);
  const api = service(['apps/api/dist/main.js'], 'API');
  await ready(`${env.TEST_API_URL}/health`, api);
  if (!process.argv.includes('--e2e-only')) {
    await run(['--test', '--test-concurrency=1', ...readdirSync('tests/api').filter(f => f.endsWith('.test.mjs')).map(f => `tests/api/${f}`)]);
  }
  if (!process.argv.includes('--api-only')) {
    const web = service([resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5174', '--strictPort'], 'Web', { cwd: resolve('apps/web') });
    await ready(env.TEST_WEB_URL, web);
    await run(['node_modules/@playwright/test/cli.js', 'test']);
  }
  success = true;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const child of services.reverse()) await stop(child);
  if (created) {
    // Only the generated database owned by this invocation is removed.
    await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()', [databaseName]);
    await admin.query(`DROP DATABASE "${databaseName}"`);
  }
  await admin.end();
  mkdirSync('.local', { recursive: true });
  writeFileSync('.local/verification.json', JSON.stringify({ start, finished: new Date(), success,
    suite: process.argv.includes('--api-only') ? 'api' : process.argv.includes('--e2e-only') ? 'e2e' : 'all',
    database: 'PostgreSQL 15 — base aislada por ejecución' }, null, 2));
}
