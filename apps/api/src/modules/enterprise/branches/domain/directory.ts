import { TransactionContext } from '../../../../shared/domain/context';
export abstract class BranchDirectory {
    abstract isActive(id: number, tx: TransactionContext): Promise<boolean>;
}
