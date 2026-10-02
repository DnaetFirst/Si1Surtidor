import { createDataSource } from './data-source';
import { seed } from './seed';
async function main() {
  const db = createDataSource();
  await db.initialize();
  try {
    if (process.argv[2] === 'migrate') {
      const done = await db.runMigrations({ transaction: 'all' });
      console.log(`Migraciones aplicadas: ${done.length}`);
    } else if (process.argv[2] === 'seed') {
      await seed(db);
      console.log('Roles, permisos y cuentas iniciales listos.');
    } else throw new Error('Usar migrate o seed');
  } finally { await db.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
