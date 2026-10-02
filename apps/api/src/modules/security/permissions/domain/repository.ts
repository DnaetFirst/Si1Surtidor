import { AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CAPABILITIES } from './capabilities';
import { PermissionDto, UpdatePermissionDto } from './commands';
import { PermissionRecord } from './models';
export abstract class PermissionsRepository {
    abstract permissions(query: ListQuery): Promise<PageResult<PermissionRecord>>;
    abstract permission(id: number, tx?: TransactionContext): Promise<PermissionRecord>;
    abstract assignablePermissions(req: AuthRequest): Promise<PermissionRecord[]>;
    abstract insert(capability: typeof CAPABILITIES[number], dto: PermissionDto, tx?: TransactionContext): Promise<{
        id: number;
    }[]>;
    abstract rename(dto: UpdatePermissionDto, id: number, tx?: TransactionContext): Promise<unknown[]>;
    abstract describe(dto: UpdatePermissionDto, id: number, tx?: TransactionContext): Promise<unknown[]>;
    abstract assignments(id: number, tx?: TransactionContext): Promise<{
        existe: boolean;
    }[]>;
    abstract disable(id: number, tx?: TransactionContext): Promise<unknown[]>;
    abstract exportRecords(query: ListQuery): Promise<PermissionRecord[]>;
}
