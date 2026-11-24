import { DataSource } from 'typeorm';
import '../config';
import { requiredEnv } from '../config';
import { CycleOne1700000000000, PasswordReset1700000000001, CycleTwo1700000000002, CycleThree1700000000004, CycleThreePatch1700000000005, CycleThreeFourAlignment1700000000006, NotificationEmail1700000000007 } from './migration';
import { BranchManagement1700000000003 } from './branches-migration';

export function createDataSource(): DataSource {
  return new DataSource({
    type: 'postgres', url: requiredEnv('DATABASE_URL'),
    migrations: [CycleOne1700000000000, PasswordReset1700000000001, CycleTwo1700000000002, BranchManagement1700000000003, CycleThree1700000000004, CycleThreePatch1700000000005, CycleThreeFourAlignment1700000000006, NotificationEmail1700000000007], synchronize: false,
    migrationsRun: false, logging: false,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });
}
