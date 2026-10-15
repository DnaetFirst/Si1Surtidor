import { DataSource } from 'typeorm';
import '../config';
import { requiredEnv } from '../config';
import { CycleOne1700000000000, PasswordReset1700000000001, CycleTwo1700000000002 } from './migration';

export function createDataSource(): DataSource {
  return new DataSource({
    type: 'postgres', url: requiredEnv('DATABASE_URL'),
    migrations: [CycleOne1700000000000, PasswordReset1700000000001, CycleTwo1700000000002], synchronize: false,
    migrationsRun: false, logging: false,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });
}
