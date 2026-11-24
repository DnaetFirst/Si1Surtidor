import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreatePurchaseReceiptCommand, UpdatePurchaseReceiptCommand } from './commands';
import { BatchRecord, PurchaseReceiptRecord } from './models';

export abstract class PurchaseReceiptRepository {
  abstract list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<PurchaseReceiptRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<PurchaseReceiptRecord | null>;
  abstract findByCode(codigo: string, tx?: TransactionContext): Promise<PurchaseReceiptRecord | null>;
  abstract create(cmd: CreatePurchaseReceiptCommand, ciUsuario: string, tx?: TransactionContext): Promise<PurchaseReceiptRecord>;
  abstract update(id: number, cmd: UpdatePurchaseReceiptCommand, tx?: TransactionContext): Promise<PurchaseReceiptRecord>;
  abstract annul(id: number, tx?: TransactionContext): Promise<PurchaseReceiptRecord>;
  abstract generateNextCode(tx?: TransactionContext): Promise<string>;
  abstract listBatches(query: ListQuery, productId?: number, tx?: TransactionContext): Promise<PageResult<BatchRecord>>;
  abstract getOrderStatus(orderId: number, tx?: TransactionContext): Promise<string | null>;
  abstract isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean>;
  abstract isProviderActive(providerId: number, tx?: TransactionContext): Promise<boolean>;
  abstract isProductActive(productId: number, tx?: TransactionContext): Promise<boolean>;
}
