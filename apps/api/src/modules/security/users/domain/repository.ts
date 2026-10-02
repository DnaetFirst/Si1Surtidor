import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateUserDto, UpdateUserDto } from './commands';
import { UserRecord } from './models';
export abstract class UsersRepository {
    abstract users(query: ListQuery): Promise<PageResult<UserRecord>>;
    abstract user(ci: string, tx?: TransactionContext): Promise<UserRecord>;
    abstract insert(dto: CreateUserDto, passwordHash: string, tx?: TransactionContext): Promise<unknown[]>;
    abstract update(dto: UpdateUserDto, ci: string, passwordHash: string | undefined, tx?: TransactionContext): Promise<unknown[]>;
    abstract revokeSessions(ci: string, tx?: TransactionContext): Promise<unknown[]>;
    abstract disable(ci: string, tx?: TransactionContext): Promise<unknown[]>;
}
