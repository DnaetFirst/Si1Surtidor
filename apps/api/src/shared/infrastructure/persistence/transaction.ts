import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionContext, UnitOfWork } from '../../domain/context';
import { ConflictException } from '../../domain/errors';
class TypeOrmContext implements TransactionContext {
    readonly transactionId = Symbol('transaction');
    constructor(readonly manager: EntityManager) { }
}
export function database(db: DataSource, tx?: TransactionContext): DataSource | EntityManager {
    if (!tx)
        return db;
    if (!(tx instanceof TypeOrmContext))
        throw new Error('Invalid transaction context');
    return tx.manager;
}
@Injectable()
export class TypeOrmUnitOfWork extends UnitOfWork {
    constructor(private readonly db: DataSource) { super(); }
    async transaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
        try {
            return await this.db.transaction(manager => work(new TypeOrmContext(manager)));
        }
        catch (error: unknown) {
            const pg = error as {
                code?: string;
                driverError?: {
                    code?: string;
                };
            };
            const code = pg.code ?? pg.driverError?.code;
            if (code === '23505')
                throw new ConflictException('Ya existe un registro con ese CI, correo, nombre o capacidad.');
            if (code === '23503')
                throw new ConflictException('El registro tiene relaciones activas o la referencia no existe.');
            throw error;
        }
    }
}
