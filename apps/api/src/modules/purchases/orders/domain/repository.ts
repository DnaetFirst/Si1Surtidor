import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreatePurchaseOrderCommand, UpdatePurchaseOrderCommand, UpdatePurchaseOrderStatusCommand } from './commands';
import { PurchaseOrderRecord } from './models';

export abstract class PurchaseOrderRepository {
  abstract list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<PurchaseOrderRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<PurchaseOrderRecord | null>;
  abstract findByCode(codigo: string, tx?: TransactionContext): Promise<PurchaseOrderRecord | null>;
  abstract create(cmd: CreatePurchaseOrderCommand, ciUsuario: string, tx?: TransactionContext): Promise<PurchaseOrderRecord>;
  abstract update(id: number, cmd: UpdatePurchaseOrderCommand, tx?: TransactionContext): Promise<PurchaseOrderRecord>;
  abstract updateStatus(id: number, cmd: UpdatePurchaseOrderStatusCommand, tx?: TransactionContext): Promise<PurchaseOrderRecord>;
  abstract generateNextCode(tx?: TransactionContext): Promise<string>;
  abstract isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean>;
  abstract isProviderActive(providerId: number, tx?: TransactionContext): Promise<boolean>;
  abstract isProductActive(productId: number, tx?: TransactionContext): Promise<boolean>;
  abstract hasReceipts(id: number, tx?: TransactionContext): Promise<boolean>;
}
