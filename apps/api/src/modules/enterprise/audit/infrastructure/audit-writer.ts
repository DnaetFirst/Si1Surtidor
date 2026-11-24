import { isIP } from 'node:net';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditWriter, AuthRequest, RequestContext, TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
export function auditClientIp(req: RequestContext): string | null {
    const peer = req.socket?.remoteAddress;
    const localApache = peer === '127.0.0.1' || peer === '::1' || peer === '::ffff:127.0.0.1';
    const edgeIp = req.headers?.['cf-connecting-ip'];
    const renderEdge = process.env.RENDER === 'true' && localApache && typeof edgeIp === 'string' && isIP(edgeIp);
    const ip = renderEdge ? edgeIp : req.ip || peer;
    if (!ip || !isIP(ip)) return null;
    return ip.startsWith('::ffff:') && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip;
}

@Injectable()
export class PostgresAuditWriter extends AuditWriter {
    constructor(private readonly db: DataSource) { super(); }
    async record(req: AuthRequest, action: string, entity: string, tx?: TransactionContext) {
        const user = req.user!;
        await database(this.db, tx).query(`INSERT INTO bitacora(usuario_ci,usuario_nombre,identidad,accion,resultado,fecha,ip,endpoint,entidad) VALUES($1,$2,$3,$4,'SUCCESS',now(),$5,$6,$7)`, [user.ci, user.nombre, user.correo, action, auditClientIp(req), `${req.method} ${req.path}`, entity]);
    }
    async authentication(req: RequestContext, action: string, result: string, row?: {
        ci: string;
        nombre: string;
    }, identity?: string, tx?: TransactionContext) {
        await database(this.db, tx).query(`INSERT INTO bitacora(usuario_ci,usuario_nombre,identidad,accion,resultado,ip,endpoint,entidad)
      VALUES($1,$2,$3,$4,$5,$6,$7,'sesion')`, [row?.ci ?? null, row?.nombre ?? null, identity ?? null, action, result, auditClientIp(req), req.originalUrl.split('?')[0]]);
    }
}
