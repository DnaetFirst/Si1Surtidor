import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { BranchDirectory } from '../domain/directory';
@Injectable()
export class PostgresBranchDirectory extends BranchDirectory {
    constructor(private readonly db: DataSource) { super(); }
    async isActive(id: number, tx: TransactionContext) { const [branch] = await database(this.db, tx).query('SELECT id FROM sucursal WHERE id=$1 AND activo=true', [id]); return !!branch; }
}
