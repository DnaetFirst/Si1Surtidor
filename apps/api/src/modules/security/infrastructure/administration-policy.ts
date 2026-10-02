import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../shared/domain/context';
import { database } from '../../../shared/infrastructure/persistence/transaction';
import { AdministrationRepository } from '../domain/administration.repository';
@Injectable()
export class PostgresAdministrationRepository extends AdministrationRepository {
    constructor(private readonly db: DataSource) { super(); }
    activeRole(roleId: number, tx: TransactionContext) { return database(this.db, tx).query('SELECT * FROM rol WHERE id=$1 AND activo=true', [roleId]); }
    reservedRole(roleId: number, tx: TransactionContext) { return database(this.db, tx).query('SELECT EXISTS(SELECT 1 FROM permiso_rol pr JOIN permiso p ON p.id=pr.id_permiso WHERE pr.id_rol=$1 AND p.reservado=true) AS existe', [roleId]); }
    hasAdministrator(tx: TransactionContext) {
        return database(this.db, tx).query(`SELECT EXISTS(
      SELECT 1 FROM usuario u JOIN rol r ON r.id=u.id_rol WHERE u.activo=true AND r.activo=true AND r.codigo='ATI'
      AND (EXISTS(SELECT 1 FROM permiso_rol pr JOIN permiso p ON p.id=pr.id_permiso WHERE pr.id_rol=r.id AND p.activo=true AND p.codigo='usuarios.gestionar')
        OR (SELECT count(DISTINCT p.codigo) FROM permiso_rol pr JOIN permiso p ON p.id=pr.id_permiso WHERE pr.id_rol=r.id AND p.activo=true AND p.codigo IN ('usuarios.ver','usuarios.crear','usuarios.editar','usuarios.deshabilitar'))=4)
      AND (EXISTS(SELECT 1 FROM permiso_rol pr JOIN permiso p ON p.id=pr.id_permiso WHERE pr.id_rol=r.id AND p.activo=true AND p.codigo='roles.gestionar')
        OR (SELECT count(DISTINCT p.codigo) FROM permiso_rol pr JOIN permiso p ON p.id=pr.id_permiso WHERE pr.id_rol=r.id AND p.activo=true AND p.codigo IN ('roles.ver','roles.crear','roles.editar','roles.deshabilitar'))=4)
    ) AS existe`);
    }
}
