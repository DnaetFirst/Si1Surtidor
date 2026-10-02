import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuditWriter, AuthRequest, TransactionContext, UnitOfWork } from '../../../shared/domain/context';
import { ForbiddenException, UnauthorizedException } from '../../../shared/domain/errors';
import { MutationAuthorization } from '../domain/mutation-authorization';
@Injectable()
export class AdministrativeTransactionService extends AdministrativeTransaction {
    constructor(private readonly unitOfWork: UnitOfWork, private readonly authorization: MutationAuthorization, private readonly auditWriter: AuditWriter) { super(); }
    mutation<T>(req: AuthRequest, action: string, entity: string, work: (tx: TransactionContext) => Promise<T>): Promise<T> {
        return this.unitOfWork.transaction(async (tx) => {
            // Revalidate after acquiring the lock: permissions may change while waiting.
            await this.authorization.lock(tx);
            const current = await this.authorization.current(req.sessionId, req.user.ci, tx);
            if (!current)
                throw new UnauthorizedException('La sesión ha expirado o fue revocada. Inicie sesión nuevamente.');
            const permissions = await this.authorization.permissions(current.rolId, tx);
            const codes = permissions.filter(p => !p.reservado || current.rolCodigo === 'ASU').map(p => p.codigo);
            const module = action.split('.')[0];
            if (action !== 'perfil.editar' && !codes.includes(action) && !codes.includes(`${module}.gestionar`))
                throw new ForbiddenException('Sus permisos cambiaron. No tiene autorización para realizar esta operación.');
            req.user = { ci: current.ci, nombre: current.nombre, correo: current.correo, rol: { id: current.rolId, codigo: current.rolCodigo, nombre: current.rolNombre }, permisos: codes };
            const result = await work(tx);
            await this.auditWriter.record(req, action, entity, tx);
            return result;
        });
    }
}
