import { AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { RoleDto, UpdateRoleDto } from './commands';
import { RoleOption, RoleRecord } from './models';
export abstract class RolesRepository {
    abstract roles(query: ListQuery): Promise<PageResult<RoleRecord>>;
    abstract role(id: number, tx?: TransactionContext): Promise<RoleRecord>;
    abstract roleOptions(req: AuthRequest): Promise<RoleOption[]>;
    abstract activePermissions(ids: number[], tx?: TransactionContext): Promise<{
        id: number;
        reservado: boolean;
    }[]>;
    abstract clearPermissions(roleId: number, tx?: TransactionContext): Promise<unknown[]>;
    abstract assignPermissions(roleId: number, ids: number[], tx?: TransactionContext): Promise<unknown[]>;
    abstract insert(dto: RoleDto, tx?: TransactionContext): Promise<{
        id: number;
    }[]>;
    abstract rename(dto: UpdateRoleDto, id: number, tx?: TransactionContext): Promise<unknown[]>;
    abstract assignments(id: number, tx?: TransactionContext): Promise<{
        existe: boolean;
    }[]>;
    abstract disable(id: number, tx?: TransactionContext): Promise<unknown[]>;
}
