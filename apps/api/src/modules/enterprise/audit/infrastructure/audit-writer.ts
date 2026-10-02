import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditWriter, AuthRequest, RequestContext, TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
@Injectable()
export class PostgresAuditWriter extends AuditWriter {
    constructor(private readonly db: DataSource) { super(); }
    async record(req: AuthRequest, action: string, entity: string, tx?: TransactionContext) {
        const user = req.user!;
        await database(this.db, tx).query(`INSERT INTO bitacora(usuario_ci,usuario_nombre,identidad,accion,resultado,fecha,ip,endpoint,entidad) VALUES($1,$2,$3,$4,'SUCCESS',now(),$5,$6,$7)`, [user.ci, user.nombre, user.correo, action, req.ip || req.socket?.remoteAddress || '', `${req.method} ${req.path}`, entity]);
    }
    async authentication(req: RequestContext, action: string, result: string, row?: {
        ci: string;
        nombre: string;
    }, identity?: string, tx?: TransactionContext) {
        await database(this.db, tx).query(`INSERT INTO bitacora(usuario_ci,usuario_nombre,identidad,accion,resultado,ip,endpoint,entidad)
      VALUES($1,$2,$3,$4,$5,$6,$7,'sesion')`, [row?.ci ?? null, row?.nombre ?? null, identity ?? null, action, result, req.ip ?? null, req.originalUrl.split('?')[0]]);
    }
}
