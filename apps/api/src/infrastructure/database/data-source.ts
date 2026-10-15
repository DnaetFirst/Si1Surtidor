import { DataSource } from 'typeorm';
import '../config';
import { requiredEnv } from '../config';
import { CycleOne1700000000000, PasswordReset1700000000001, CycleTwo1700000000002 } from './migration';
import { BranchManagement1700000000003 } from './branches-migration';

export function createDataSource(): DataSource {
  return new DataSource({
    type: 'postgres', url: requiredEnv('DATABASE_URL'),
    migrations: [CycleOne1700000000000, PasswordReset1700000000001, CycleTwo1700000000002, BranchManagement1700000000003], synchronize: false,
    migrationsRun: false, logging: false,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });
}
