import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateProductExitCommand } from './commands';
import { ProductExitRecord } from './models';

export abstract class ProductExitRepository {
  abstract list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<ProductExitRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<ProductExitRecord | null>;
  abstract create(cmd: CreateProductExitCommand, tx?: TransactionContext, userCi?: string): Promise<ProductExitRecord>;
}
