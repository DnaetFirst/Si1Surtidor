import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuditWriter, AuthRequest } from '../../../../shared/domain/context';
import { csv } from '../../../../shared/domain/csv';
import { assertDateRange } from '../domain/calendar';
import { ArchiveDto, AuditQuery } from '../domain/commands';
import { AuditRepository } from '../domain/repository';
@Injectable()
export class AuditService {
    constructor(private readonly repository: AuditRepository, private readonly transactions: AdministrativeTransaction, private readonly auditWriter: AuditWriter) { }
    auditRecords(query: AuditQuery) { return this.repository.auditRecords(query); }
    async exportAudit(query: AuditQuery, req: AuthRequest) {
        const records = await this.repository.exportRecords(query);
        await this.auditWriter.record(req, 'bitacora.exportar', 'bitacora');
        return csv(['ID', 'CI', 'Usuario', 'Identidad', 'Acción', 'Resultado', 'Fecha UTC', 'IP', 'Endpoint', 'Entidad', 'Archivo UTC'], records.map((item: any) => [item.id, item.usuarioCi, item.usuarioNombre, item.identidad, item.accion, item.resultado, item.fecha, item.ip, item.endpoint, item.entidad, item.archivadoAt]));
    }
    async archive(dto: ArchiveDto, req: AuthRequest) {
        assertDateRange(dto.desde, dto.hasta);
        return this.transactions.mutation(req, 'bitacora.archivar', 'bitacora', async (tx) => {
            const [{ total }] = await this.repository.archiveRange(dto, tx);
            return { total, mensaje: `${total} registros archivados. Se conservan para consulta y exportación.` };
        });
    }
}
