import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateSaleCommand } from './commands';
import { CustomerRecord, SaleRecord } from './models';

export abstract class SaleRepository {
  abstract list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<SaleRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<SaleRecord | null>;
  abstract findByCode(codigo: string, tx?: TransactionContext): Promise<SaleRecord | null>;
  abstract create(cmd: CreateSaleCommand, ciUsuario: string, tx?: TransactionContext): Promise<SaleRecord>;
  abstract generateNextCode(tx?: TransactionContext): Promise<string>;
  abstract findOrCreateCustomer(nit: string, nombre: string, placa: string, branchId?: number, tx?: TransactionContext): Promise<CustomerRecord>;
  abstract listCustomers(query: ListQuery, tx?: TransactionContext): Promise<PageResult<CustomerRecord>>;
}
