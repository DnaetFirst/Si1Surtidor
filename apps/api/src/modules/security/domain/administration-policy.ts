import { AuthRequest, TransactionContext } from '../../../shared/domain/context';
export abstract class AdministrationPolicy {
    abstract assertAssignableRole(tx: TransactionContext, roleId: number, req: AuthRequest): Promise<unknown>;
    abstract assertBranch(tx: TransactionContext, id?: number | null): Promise<void>;
    abstract assertLastATI(tx: TransactionContext): Promise<void>;
}
