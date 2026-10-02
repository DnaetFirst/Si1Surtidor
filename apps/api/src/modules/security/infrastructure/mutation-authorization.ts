import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../shared/domain/context';
import { database } from '../../../shared/infrastructure/persistence/transaction';
import { MutationAuthorization } from '../domain/mutation-authorization';
@Injectable()
export class PostgresMutationAuthorization extends MutationAuthorization {
    constructor(private readonly db: DataSource) { super(); }
    async lock(tx: TransactionContext) { await database(this.db, tx).query('SELECT pg_advisory_xact_lock(1001)'); }
    async current(sessionId: string, ci: string, tx: TransactionContext) {
        const [current] = await database(this.db, tx).query(`SELECT u.ci,u.nombre,u.correo,r.id AS "rolId",r.codigo AS "rolCodigo",r.nombre AS "rolNombre"
      FROM sesion s JOIN usuario u ON u.ci=s.ci_usuario JOIN rol r ON r.id=u.id_rol
      WHERE s.id=$1 AND s.ci_usuario=$2 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.activo=true AND r.activo=true
      FOR SHARE OF s,u,r`, [sessionId, ci]);
        return current;
    }
    permissions(roleId: number, tx: TransactionContext) {
        return database(this.db, tx).query('SELECT p.codigo,p.reservado FROM permiso p JOIN permiso_rol pr ON pr.id_permiso=p.id WHERE pr.id_rol=$1 AND p.activo=true', [roleId]);
    }
}
