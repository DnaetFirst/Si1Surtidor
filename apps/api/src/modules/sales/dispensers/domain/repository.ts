import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateDispenserCommand, CreateHoseCommand, UpdateDispenserCommand, UpdateHoseCommand } from './commands';
import { DispenserRecord, HoseRecord } from './models';

export abstract class DispenserRepository {
  abstract list(query: ListQuery, branchId?: number): Promise<PageResult<DispenserRecord>>;
  abstract findById(id: number, tx?: TransactionContext): Promise<DispenserRecord | null>;
  abstract create(data: CreateDispenserCommand, tx: TransactionContext): Promise<DispenserRecord>;
  abstract update(id: number, data: UpdateDispenserCommand, tx: TransactionContext): Promise<DispenserRecord>;
  abstract disable(id: number, tx: TransactionContext): Promise<DispenserRecord>;
  abstract getHoses(dispenserId: number, tx?: TransactionContext): Promise<HoseRecord[]>;
  abstract addHose(dispenserId: number, data: CreateHoseCommand, tx: TransactionContext): Promise<HoseRecord>;
  abstract updateHose(hoseId: number, data: UpdateHoseCommand, tx: TransactionContext): Promise<HoseRecord>;
  abstract disableHose(hoseId: number, tx: TransactionContext): Promise<HoseRecord>;
  abstract isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean>;
  abstract isFuelActive(fuelId: number, tx?: TransactionContext): Promise<boolean>;
}
