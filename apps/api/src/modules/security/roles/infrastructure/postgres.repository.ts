import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery } from '../../../../shared/domain/pagination';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { RoleDto, UpdateRoleDto } from '../domain/commands';
import { RolesRepository } from '../domain/repository';
const roleFields = `r.id,r.codigo,r.nombre,r.activo,r.created_at AS "createdAt",
  (SELECT count(*)::int FROM usuario u WHERE u.id_rol=r.id) AS "usuariosCount",
  COALESCE((SELECT json_agg(json_build_object('id',p.id,'codigo',p.codigo,'nombre',p.nombre,'descripcion',p.descripcion,'modulo',p.modulo,'accion',p.accion,'reservado',p.reservado,'activo',p.activo) ORDER BY p.modulo,p.accion) FROM permiso p JOIN permiso_rol pr ON pr.id_permiso=p.id WHERE pr.id_rol=r.id),'[]'::json) AS permisos`;
@Injectable()
export class PostgresRolesRepository extends RolesRepository {
    constructor(private readonly db: DataSource) { super(); }
    async roles(query: ListQuery) {
        const { params, where } = filters(query, 'r.');
        if (query.q) {
            params.push(`%${query.q}%`);
            where.push(`(r.nombre ILIKE $${params.length} OR r.codigo ILIKE $${params.length})`);
        }
        return page(this.db, roleFields, 'rol r', where, params, query, 'r.nombre,r.id');
    }
    async role(id: number, tx?: TransactionContext) {
        const [role] = await database(this.db, tx).query(`SELECT ${roleFields} FROM rol r WHERE r.id=$1`, [id]);
        if (!role)
            throw new NotFoundException('Rol no encontrado.');
        return { ...role, permisoIds: role.permisos.map((permission: {
                id: number;
            }) => permission.id) };
    }
    async roleOptions(req: AuthRequest) {
        return this.db.query(`SELECT r.id,r.codigo,r.nombre FROM rol r WHERE r.activo=true ${(req.user.rol.codigo === 'ASU') ? '' : "AND r.codigo<>'ASU' AND NOT EXISTS(SELECT 1 FROM permiso_rol pr JOIN permiso p ON p.id=pr.id_permiso WHERE pr.id_rol=r.id AND p.reservado=true)"} ORDER BY r.nombre`);
    }
    async activePermissions(ids: number[], tx?: TransactionContext) { return database(this.db, tx).query('SELECT id,reservado FROM permiso WHERE id=ANY($1::int[]) AND activo=true', [ids]); }
    async clearPermissions(roleId: number, tx?: TransactionContext) { return database(this.db, tx).query('DELETE FROM permiso_rol WHERE id_rol=$1', [roleId]); }
    async assignPermissions(roleId: number, ids: number[], tx?: TransactionContext) { return database(this.db, tx).query('INSERT INTO permiso_rol(id_rol,id_permiso) SELECT $1,unnest($2::int[])', [roleId, ids]); }
    async insert(dto: RoleDto, tx?: TransactionContext) { return database(this.db, tx).query('INSERT INTO rol(codigo,nombre) VALUES($1,$2) RETURNING id', [`CUSTOM_${randomUUID()}`, dto.nombre]); }
    async rename(dto: UpdateRoleDto, id: number, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE rol SET nombre=$1 WHERE id=$2', [dto.nombre, id]); }
    async assignments(id: number, tx?: TransactionContext) { return database(this.db, tx).query('SELECT EXISTS(SELECT 1 FROM usuario WHERE id_rol=$1) AS existe', [id]); }
    async disable(id: number, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE rol SET activo=false WHERE id=$1', [id]); }
}
