import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery } from '../../../../shared/domain/pagination';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CreateUserDto, UpdateUserDto } from '../domain/commands';
import { UsersRepository } from '../domain/repository';
const userFields = `u.ci,u.nombre,u.correo,u.telefono,u.cargo,u.sexo,u.domicilio,u.activo,u.created_at AS "createdAt",u.updated_at AS "updatedAt",u.id_rol AS "rolId",u.id_sucursal AS "sucursalId",json_build_object('id',r.id,'codigo',r.codigo,'nombre',r.nombre) AS rol,CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id',s.id,'nombre',s.nombre) END AS sucursal`;
const userJoin = 'usuario u JOIN rol r ON r.id=u.id_rol LEFT JOIN sucursal s ON s.id=u.id_sucursal';
@Injectable()
export class PostgresUsersRepository extends UsersRepository {
    constructor(private readonly db: DataSource) { super(); }
    async users(query: ListQuery) {
        const { params, where } = filters(query, 'u.');
        if (query.q) {
            params.push(`%${query.q}%`);
            where.push(`(u.nombre ILIKE $${params.length} OR u.correo ILIKE $${params.length} OR u.ci ILIKE $${params.length})`);
        }
        return page(this.db, userFields, userJoin, where, params, query, 'u.nombre,u.ci');
    }
    async user(ci: string, tx?: TransactionContext) {
        const [user] = await database(this.db, tx).query(`SELECT ${userFields} FROM ${userJoin} WHERE u.ci=$1`, [ci]);
        if (!user)
            throw new NotFoundException('Usuario no encontrado.');
        return user;
    }
    async insert(dto: CreateUserDto, passwordHash: string, tx?: TransactionContext) { return database(this.db, tx).query(`INSERT INTO usuario(ci,nombre,correo,telefono,cargo,sexo,domicilio,password_hash,id_rol,id_sucursal) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [dto.ci, dto.nombre, dto.correo, dto.telefono, dto.cargo || null, dto.sexo, dto.domicilio, passwordHash, dto.rolId, dto.sucursalId ?? null]); }
    async update(dto: UpdateUserDto, ci: string, passwordHash: string | undefined, tx?: TransactionContext) {
        const mapping: Record<string, unknown> = {
            nombre: dto.nombre, correo: dto.correo, telefono: dto.telefono, cargo: dto.cargo,
            sexo: dto.sexo, domicilio: dto.domicilio, id_rol: dto.rolId, id_sucursal: dto.sucursalId,
            password_hash: passwordHash,
        };
        const entries = Object.entries(mapping).filter(([, value]) => value !== undefined);
        if (!entries.length)
            return [];
        return database(this.db, tx).query(`UPDATE usuario SET ${entries.map(([key], index) => `${key}=$${index + 1}`).join(',')},updated_at=now() WHERE ci=$${entries.length + 1}`, [...entries.map(([, value]) => value), ci]);
    }
    async revokeSessions(ci: string, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE sesion SET revoked_at=now() WHERE ci_usuario=$1 AND revoked_at IS NULL', [ci]); }
    async disable(ci: string, tx?: TransactionContext) { return database(this.db, tx).query('UPDATE usuario SET activo=false,updated_at=now() WHERE ci=$1', [ci]); }
}
