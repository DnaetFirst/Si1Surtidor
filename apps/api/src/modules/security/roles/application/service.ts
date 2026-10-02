import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, ForbiddenException } from '../../../../shared/domain/errors';
import { ListQuery } from '../../../../shared/domain/pagination';
import { AdministrationPolicy } from '../../domain/administration-policy';
import { assertPermissionSelection } from '../../domain/protection';
import { RoleDto, UpdateRoleDto } from '../domain/commands';
import { RolesRepository } from '../domain/repository';
@Injectable()
export class RolesService {
    constructor(private readonly repository: RolesRepository, private readonly transactions: AdministrativeTransaction, private readonly policy: AdministrationPolicy) { }
    roles(query: ListQuery) { return this.repository.roles(query); }
    role(id: number, tx?: TransactionContext) { return this.repository.role(id, tx); }
    roleOptions(req: AuthRequest) { return this.repository.roleOptions(req); }
    private async setPermissions(tx: TransactionContext, roleId: number, ids: number[], req: AuthRequest) {
        const permissions = ids.length ? await this.repository.activePermissions(ids, tx) : [];
        assertPermissionSelection(req.user.rol.codigo, ids.length, permissions);
        await this.repository.clearPermissions(roleId, tx);
        if (ids.length)
            await this.repository.assignPermissions(roleId, ids, tx);
    }
    async createRole(dto: RoleDto, req: AuthRequest) {
        return this.transactions.mutation(req, 'roles.crear', 'rol', async (tx) => {
            const [role] = await this.repository.insert(dto, tx);
            await this.setPermissions(tx, role.id, dto.permisoIds, req);
            return this.repository.role(role.id, tx);
        });
    }
    async updateRole(id: number, dto: UpdateRoleDto, req: AuthRequest) {
        return this.transactions.mutation(req, 'roles.editar', 'rol', async (tx) => {
            const existing = await this.repository.role(id, tx);
            if ((existing.codigo === 'ASU' || existing.permisos.some((permission: {
                reservado: boolean;
            }) => permission.reservado)) && !(req.user.rol.codigo === 'ASU'))
                throw new ForbiddenException('El rol y los privilegios del ASU están protegidos.');
            if (dto.nombre !== undefined)
                await this.repository.rename(dto, id, tx);
            if (dto.permisoIds !== undefined)
                await this.setPermissions(tx, id, dto.permisoIds, req);
            await this.policy.assertLastATI(tx);
            return this.repository.role(id, tx);
        });
    }
    async disableRole(id: number, req: AuthRequest) {
        return this.transactions.mutation(req, 'roles.deshabilitar', 'rol', async (tx) => {
            const existing = await this.repository.role(id, tx);
            if (existing.codigo === 'ASU' && !(req.user.rol.codigo === 'ASU'))
                throw new ForbiddenException('El rol ASU está protegido.');
            const [{ existe }] = await this.repository.assignments(id, tx);
            if (existe)
                throw new ConflictException('No se puede deshabilitar un rol asignado a usuarios.');
            await this.repository.disable(id, tx);
            await this.policy.assertLastATI(tx);
            return this.repository.role(id, tx);
        });
    }
}
