import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateProviderCommand, LinkProductCommand, UpdateProviderCommand } from './commands';
import { ProviderProductRecord, ProviderRecord } from './models';

export abstract class ProviderRepository {
  abstract list(query: ListQuery): Promise<PageResult<ProviderRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<ProviderRecord | null>;
  abstract findByNit(nit: string, tx?: TransactionContext): Promise<ProviderRecord | null>;
  abstract duplicate(nit: string, exceptId: number | null, tx?: TransactionContext): Promise<boolean>;
  abstract create(data: CreateProviderCommand, tx: TransactionContext): Promise<ProviderRecord>;
  abstract update(id: number, data: UpdateProviderCommand, tx: TransactionContext): Promise<ProviderRecord>;
  abstract disable(id: number, tx: TransactionContext): Promise<ProviderRecord>;
  abstract toggleStatus(id: number, tx: TransactionContext): Promise<ProviderRecord>;
  abstract getProducts(providerId: number, tx?: TransactionContext): Promise<ProviderProductRecord[]>;
  abstract linkProduct(providerId: number, data: LinkProductCommand, tx: TransactionContext): Promise<ProviderProductRecord>;
  abstract unlinkProduct(providerId: number, productId: number, tx: TransactionContext): Promise<void>;
  abstract hasOrdersOrPurchases(id: number, tx?: TransactionContext): Promise<boolean>;
  abstract isProductActive(productId: number, tx?: TransactionContext): Promise<boolean>;
}
