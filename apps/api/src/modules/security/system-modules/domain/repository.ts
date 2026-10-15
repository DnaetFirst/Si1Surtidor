import { TransactionContext } from '../../../../shared/domain/context';
import { CreateSystemModuleCommand, UpdateSystemModuleCommand } from './commands';
import { SystemModule } from './models';

export abstract class SystemModuleRepository {
  abstract list(tx?: TransactionContext): Promise<SystemModule[]>;
  abstract findById(id: number, tx?: TransactionContext): Promise<SystemModule | null>;
  abstract findByCode(code: string, tx?: TransactionContext): Promise<SystemModule | null>;
  abstract create(data: CreateSystemModuleCommand, tx?: TransactionContext): Promise<SystemModule>;
  abstract update(id: number, data: UpdateSystemModuleCommand, tx?: TransactionContext): Promise<SystemModule>;
  abstract delete(id: number, tx?: TransactionContext): Promise<void>;
}
