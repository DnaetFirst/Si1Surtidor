import { Global,Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createDataSource } from './data-source';

@Global()
@Module({
  providers: [{ provide: DataSource, useFactory: async () => {
    const db = createDataSource();
    await db.initialize();
    return db;
  }}],
  exports: [DataSource],
})
export class DatabaseModule {}
