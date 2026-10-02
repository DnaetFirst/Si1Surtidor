import { TransactionContext } from '../../../../shared/domain/context';
import { PageResult } from '../../../../shared/domain/pagination';
import { ArchiveDto, AuditQuery } from './commands';
import { AuditRecord } from './models';
export abstract class AuditRepository {
    abstract auditRecords(query: AuditQuery): Promise<PageResult<AuditRecord>>;
    abstract exportRecords(query: AuditQuery): Promise<AuditRecord[]>;
    abstract archiveRange(dto: ArchiveDto, tx?: TransactionContext): Promise<{
        total: number;
    }[]>;
}
