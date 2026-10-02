import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { page } from '../../../../shared/infrastructure/persistence/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { assertDateRange, calendarRange } from '../domain/calendar';
import { ArchiveDto, AuditQuery } from '../domain/commands';
import { AuditRepository } from '../domain/repository';
function auditFilters(query: AuditQuery) {
    let { desde, hasta } = query;
    if (query.periodo && query.periodo !== 'todo' && !desde && !hasta)
        ({ desde, hasta } = calendarRange(query.periodo));
    assertDateRange(desde, hasta);
    const where = [query.archivado === 'true' ? 'archivado_at IS NOT NULL' : 'archivado_at IS NULL'];
    const params: unknown[] = [];
    if (desde) {
        params.push(desde);
        where.push(`fecha >= $${params.length}::timestamptz`);
    }
    if (hasta) {
        params.push(hasta);
        where.push(`fecha <= $${params.length}::timestamptz`);
    }
    if (query.usuario) {
        params.push(`%${query.usuario}%`);
        where.push(`(usuario_ci ILIKE $${params.length} OR usuario_nombre ILIKE $${params.length} OR identidad ILIKE $${params.length})`);
    }
    if (query.accion) {
        params.push(`%${query.accion}%`);
        where.push(`accion ILIKE $${params.length}`);
    }
    if (query.q) {
        params.push(`%${query.q}%`);
        where.push(`(usuario_nombre ILIKE $${params.length} OR accion ILIKE $${params.length} OR endpoint ILIKE $${params.length})`);
    }
    return { where, params };
}
const auditFields = 'id::text,usuario_ci AS "usuarioCi",usuario_nombre AS "usuarioNombre",identidad,accion,resultado,fecha,ip,endpoint,entidad,archivado_at AS "archivadoAt"';
@Injectable()
export class PostgresAuditRepository extends AuditRepository {
    constructor(private readonly db: DataSource) { super(); }
    auditRecords(query: AuditQuery) {
        const { where, params } = auditFilters(query);
        return page(this.db, auditFields, 'bitacora', where, params, query, 'fecha DESC,id DESC');
    }
    async exportRecords(query: AuditQuery) {
        const { where, params } = auditFilters(query);
        const records = await this.db.query(`SELECT ${auditFields} FROM bitacora WHERE ${where.join(' AND ')} ORDER BY fecha DESC,id DESC`, params);
        return records;
    }
    async archiveRange(dto: ArchiveDto, tx?: TransactionContext) { return database(this.db, tx).query(`WITH archived AS (UPDATE bitacora SET archivado_at=now() WHERE archivado_at IS NULL AND fecha >= $1::timestamptz AND fecha <= $2::timestamptz RETURNING id) SELECT count(*)::int AS total FROM archived`, [dto.desde, dto.hasta]); }
}
