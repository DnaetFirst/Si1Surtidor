import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { BranchesRepository } from '../domain/repository';
import { CreateBranchCommand, UpdateBranchCommand } from '../domain/commands';

const fields = 'id,nombre,direccion,telefono,correo,activo,id_empresa AS "empresaId"';
@Injectable()
export class PostgresBranchesRepository extends BranchesRepository {
    constructor(private readonly db: DataSource) { super(); }
    branches() { return this.db.query(`SELECT ${fields} FROM sucursal WHERE activo=true ORDER BY nombre,id`); }
    list(query: ListQuery) {
        const { params, where } = filters(query);
        if (query.q) {
            params.push(`%${query.q}%`);
            where.push(`(nombre ILIKE $${params.length} OR direccion ILIKE $${params.length} OR correo ILIKE $${params.length} OR telefono ILIKE $${params.length})`);
        }
        return page(this.db, fields, 'sucursal', where, params, query, 'nombre,id');
    }
    async company(tx?: TransactionContext) {
        const [item] = await database(this.db, tx).query('SELECT id,nombre FROM empresa WHERE id=1');
        return item || null;
    }
    async find(id: number, tx?: TransactionContext) {
        const [item] = await database(this.db, tx).query(`SELECT ${fields} FROM sucursal WHERE id=$1`, [id]);
        return item || null;
    }
    async duplicate(nombre: string, exceptId: number | null, tx: TransactionContext) {
        const [item] = await database(this.db, tx).query(`SELECT 1 FROM sucursal WHERE lower(btrim(nombre))=lower(btrim($1)) AND ($2::int IS NULL OR id<>$2)`, [nombre, exceptId]);
        return !!item;
    }
    async create(data: CreateBranchCommand, empresaId: number, tx: TransactionContext) {
        const [item] = await database(this.db, tx).query(`INSERT INTO sucursal(nombre,direccion,telefono,correo,id_empresa) VALUES($1,$2,$3,$4,$5) RETURNING ${fields}`, [data.nombre, data.direccion, data.telefono, data.correo, empresaId]);
        return item;
    }
    async update(id: number, data: UpdateBranchCommand, tx: TransactionContext) {
        const entries = Object.entries({ nombre: data.nombre, direccion: data.direccion, telefono: data.telefono, correo: data.correo }).filter(([, value]) => value !== undefined);
        if (entries.length) await database(this.db, tx).query(`UPDATE sucursal SET ${entries.map(([key], i) => `${key}=$${i + 1}`).join(',')} WHERE id=$${entries.length + 1}`, [...entries.map(([, value]) => value), id]);
        return (await this.find(id, tx))!;
    }
    async disable(id: number, tx: TransactionContext) {
        await database(this.db, tx).query('UPDATE sucursal SET activo=false WHERE id=$1', [id]);
        return (await this.find(id, tx))!;
    }
}
