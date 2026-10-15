import { TransactionContext } from '../../../../shared/domain/context';
import { CreateFuelCommand, UpdateFuelCommand } from './commands';
import { Fuel } from './models';

export abstract class FuelRepository {
  abstract list(tx?: TransactionContext): Promise<Fuel[]>;
  abstract findById(id: number, tx?: TransactionContext): Promise<Fuel | null>;
  abstract findByName(name: string, tx?: TransactionContext): Promise<Fuel | null>;
  abstract create(data: CreateFuelCommand, tx?: TransactionContext): Promise<Fuel>;
  abstract update(id: number, data: UpdateFuelCommand, tx?: TransactionContext): Promise<Fuel>;
  abstract delete(id: number, tx?: TransactionContext): Promise<void>;
}
