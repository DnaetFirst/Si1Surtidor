import { TransactionContext } from '../../../../shared/domain/context';
import { CreateProductCommand, UpdateProductCommand } from './commands';
import { Product } from './models';

export abstract class ProductRepository {
  abstract list(tx?: TransactionContext): Promise<Product[]>;
  abstract findById(id: number, tx?: TransactionContext): Promise<Product | null>;
  abstract findByName(name: string, tx?: TransactionContext): Promise<Product | null>;
  abstract create(data: CreateProductCommand, tx?: TransactionContext): Promise<Product>;
  abstract update(id: number, data: UpdateProductCommand, tx?: TransactionContext): Promise<Product>;
  abstract delete(id: number, tx?: TransactionContext): Promise<void>;
  abstract categoryExists(id: number, tx?: TransactionContext): Promise<boolean>;
  abstract sucursalExists(id: number, tx?: TransactionContext): Promise<boolean>;
}
