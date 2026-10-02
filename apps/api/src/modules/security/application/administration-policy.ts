import { Injectable } from '@nestjs/common';
import { AuthRequest, TransactionContext } from '../../../shared/domain/context';
import { BadRequestException, ForbiddenException } from '../../../shared/domain/errors';
import { BranchDirectory } from '../../enterprise/branches/domain/directory';
import { AdministrationPolicy } from '../domain/administration-policy';
import { AdministrationRepository } from '../domain/administration.repository';
import { assertAdministrativeContinuity } from '../domain/protection';
@Injectable()
export class AccessAdministrationPolicy extends AdministrationPolicy {
    constructor(private readonly repository: AdministrationRepository, private readonly branches: BranchDirectory) { super(); }
    async assertAssignableRole(tx: TransactionContext, roleId: number, req: AuthRequest) {
        const [role] = await this.repository.activeRole(roleId, tx);
        if (!role)
            throw new BadRequestException('Seleccione un rol activo.');
        if (!(req.user.rol.codigo === 'ASU')) {
            const [reserved] = await this.repository.reservedRole(roleId, tx);
            if (role.codigo === 'ASU' || reserved.existe)
                throw new ForbiddenException('Los roles y privilegios de seguridad están reservados al ASU.');
        }
        return role;
    }
    async assertBranch(tx: TransactionContext, id?: number | null) {
        if (id == null)
            return;
        const branch = await this.branches.isActive(id, tx);
        if (!branch)
            throw new BadRequestException('La sucursal seleccionada no está activa.');
    }
    async assertLastATI(tx: TransactionContext) {
        const [result] = await this.repository.hasAdministrator(tx);
        assertAdministrativeContinuity(result.existe);
    }
}
