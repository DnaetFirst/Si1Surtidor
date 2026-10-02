import { TransactionContext } from '../../../shared/domain/context';
export abstract class AdministrationRepository {
    abstract activeRole(roleId: number, tx: TransactionContext): Promise<{
        id: number;
        codigo: string;
        activo: boolean;
    }[]>;
    abstract reservedRole(roleId: number, tx: TransactionContext): Promise<{
        existe: boolean;
    }[]>;
    abstract hasAdministrator(tx: TransactionContext): Promise<{
        existe: boolean;
    }[]>;
}
