import { TransactionContext } from '../../../shared/domain/context';
import { IdentityRecord } from '../auth/domain/models';
export abstract class MutationAuthorization {
    abstract lock(tx: TransactionContext): Promise<void>;
    abstract current(sessionId: string, ci: string, tx: TransactionContext): Promise<IdentityRecord | undefined>;
    abstract permissions(roleId: number, tx: TransactionContext): Promise<{
        codigo: string;
        reservado: boolean;
    }[]>;
}
