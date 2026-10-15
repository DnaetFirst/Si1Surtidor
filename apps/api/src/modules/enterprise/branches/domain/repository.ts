import { BranchRecord } from './models';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateBranchCommand, UpdateBranchCommand } from './commands';
export abstract class BranchesRepository {
    abstract branches(): Promise<BranchRecord[]>;
    abstract list(query: ListQuery): Promise<PageResult<BranchRecord>>;
    abstract company(tx?: TransactionContext): Promise<{ id: number; nombre: string } | null>;
    abstract find(id: number, tx?: TransactionContext): Promise<BranchRecord | null>;
    abstract duplicate(nombre: string, exceptId: number | null, tx: TransactionContext): Promise<boolean>;
    abstract create(data: CreateBranchCommand, empresaId: number, tx: TransactionContext): Promise<BranchRecord>;
    abstract update(id: number, data: UpdateBranchCommand, tx: TransactionContext): Promise<BranchRecord>;
    abstract disable(id: number, tx: TransactionContext): Promise<BranchRecord>;
}
