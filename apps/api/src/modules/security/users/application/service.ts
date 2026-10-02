import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/domain/pagination';
import { PasswordHasher } from '../../auth/domain/credentials';
import { AdministrationPolicy } from '../../domain/administration-policy';
import { assertAccountEditable, assertImmutableCI } from '../../domain/protection';
import { CreateUserDto, UpdateUserDto } from '../domain/commands';
import { UsersRepository } from '../domain/repository';
@Injectable()
export class UsersService {
    constructor(private readonly passwords: PasswordHasher, private readonly repository: UsersRepository, private readonly transactions: AdministrativeTransaction, private readonly policy: AdministrationPolicy) { }
    users(query: ListQuery) { return this.repository.users(query); }
    user(ci: string, tx?: TransactionContext) { return this.repository.user(ci, tx); }
    async createUser(dto: CreateUserDto, req: AuthRequest) {
        const passwordHash = await this.passwords.hash(dto.contrasena);
        return this.transactions.mutation(req, 'usuarios.crear', 'usuario', async (tx) => {
            await this.policy.assertAssignableRole(tx, dto.rolId, req);
            await this.policy.assertBranch(tx, dto.sucursalId);
            await this.repository.insert(dto, passwordHash, tx);
            return this.repository.user(dto.ci, tx);
        });
    }
    async updateUser(ci: string, dto: UpdateUserDto, req: AuthRequest) {
        assertImmutableCI(ci, dto.ci);
        const passwordHash = dto.contrasena ? await this.passwords.hash(dto.contrasena) : undefined;
        return this.transactions.mutation(req, 'usuarios.editar', 'usuario', async (tx) => {
            const existing = await this.repository.user(ci, tx);
            assertAccountEditable(req.user.rol.codigo, existing.rol.codigo);
            if (dto.rolId !== undefined)
                await this.policy.assertAssignableRole(tx, dto.rolId, req);
            await this.policy.assertBranch(tx, dto.sucursalId);
            await this.repository.update(dto, ci, passwordHash, tx);
            if (passwordHash)
                await this.repository.revokeSessions(ci, tx);
            await this.policy.assertLastATI(tx);
            return this.repository.user(ci, tx);
        });
    }
    async disableUser(ci: string, req: AuthRequest) {
        return this.transactions.mutation(req, 'usuarios.deshabilitar', 'usuario', async (tx) => {
            const existing = await this.repository.user(ci, tx);
            assertAccountEditable(req.user.rol.codigo, existing.rol.codigo);
            await this.repository.disable(ci, tx);
            await this.policy.assertLastATI(tx);
            await this.repository.revokeSessions(ci, tx);
            return this.repository.user(ci, tx);
        });
    }
}
