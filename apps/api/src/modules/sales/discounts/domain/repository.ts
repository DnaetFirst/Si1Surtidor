import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateDiscountCommand, UpdateDiscountCommand } from './commands';
import { DiscountRecord } from './models';

export abstract class DiscountRepository {
  abstract list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<DiscountRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<DiscountRecord | null>;
  abstract findActive(branchId?: number, tx?: TransactionContext): Promise<DiscountRecord[]>;
  abstract create(cmd: CreateDiscountCommand, tx?: TransactionContext): Promise<DiscountRecord>;
  abstract update(id: number, cmd: UpdateDiscountCommand, tx?: TransactionContext): Promise<DiscountRecord>;
  abstract toggleActive(id: number, tx?: TransactionContext): Promise<DiscountRecord>;
  abstract remove(id: number, tx?: TransactionContext): Promise<void>;
  abstract isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean>;
}
