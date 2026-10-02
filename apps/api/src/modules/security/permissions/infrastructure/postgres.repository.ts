import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery } from '../../../../shared/domain/pagination';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CAPABILITIES } from '../domain/capabilities';
import { PermissionDto, UpdatePermissionDto } from '../domain/commands';
import { PermissionsRepository } from '../domain/repository';
const permissionFields = 'id,codigo,nombre,descripcion,modulo,accion,reservado,activo,created_at AS "createdAt"';
@Injectable()
export class PostgresPermissionsRepository extends PermissionsRepository {
    constructor(private readonly db: DataSource) { super(); }
    async permissions(query: ListQuery) {
        const { params, where } = filters(query);
        if (query.q) {
            params.push(`%${query.q}%`);
            where.push(`(nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length} OR codigo ILIKE $${params.length})`);
        }
        return page(this.db, permissionFields, 'permiso', where, params, query, 'nombre,id');
    }
    async permission(id: number, tx?: TransactionContext) {
        const [permission] = await database(this.db, tx).query(`SELECT ${permissionFields} FROM permiso WHERE id=$1`, [id]);
        if (!permission)
            throw new NotFoundException('Permiso no encontrado.');
        return permission;
    }
    async assignablePermissions(req: AuthRequest) {
        return this.db.query(`SELECT ${permissionFields} FROM permiso WHERE activo=true ${(req.user.rol.codigo === 'ASU') ? '' : 'AND reservado=false'} ORDER BY
            CASE modulo WHEN 'usuarios' THEN 1 WHEN 'roles' THEN 2 WHEN 'permisos' THEN 3 WHEN 'empresa' THEN 4 WHEN 'bitacora' THEN 5 ELSE 6 END,
            CASE accion WHEN 'gestionar' THEN 1 WHEN 'ver' THEN 2 WHEN 'crear' THEN 3 WHEN 'editar' THEN 4 WHEN 'deshabilitar' THEN 5 WHEN 'exportar' THEN 6 WHEN 'archivar' THEN 7 ELSE 8 END,
            nombre,id`);
    }
    async insert(capability: typeof CAPABILITIES[number], dto: PermissionDto, tx?: TransactionContext) { return database(this.db, tx).query('INSERT INTO permiso(codigo,nombre,descripcion,modulo,accion,reservado) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [capability.codigo, dto.nombre, dto.descripcion, dto.modulo, dto.accion, capability.reservado]); }
    async rename(dto: UpdatePermissionDto, id: number, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE permiso SET nombre=$1 WHERE id=$2', [dto.nombre, id]); }
    async describe(dto: UpdatePermissionDto, id: number, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE permiso SET descripcion=$1 WHERE id=$2', [dto.descripcion, id]); }
    async assignments(id: number, tx?: TransactionContext) { return database(this.db, tx).query('SELECT EXISTS(SELECT 1 FROM permiso_rol WHERE id_permiso=$1) AS existe', [id]); }
    async disable(id: number, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE permiso SET activo=false WHERE id=$1', [id]); }
    async exportRecords(query: ListQuery) {
        const { params, where } = filters(query);
        if (query.q) {
            params.push(`%${query.q}%`);
            where.push(`(nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length} OR codigo ILIKE $${params.length})`);
        }
        const records = await this.db.query(`SELECT ${permissionFields} FROM permiso${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY nombre,id`, params);
        return records;
    }
}
