import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CompanyDto, UpdateCompanyDto } from '../domain/commands';
import { CompanyRepository } from '../domain/repository';
const companyFields = 'id,nombre,telefono,direccion,correo,nombre_propietario AS "nombrePropietario",fecha_creacion::text AS "fechaCreacion",logo_url AS "logoUrl",nit,created_at AS "createdAt",updated_at AS "updatedAt"';
@Injectable()
export class PostgresCompanyRepository extends CompanyRepository {
    constructor(private readonly db: DataSource) { super(); }
    async company(tx?: TransactionContext) {
        const [company] = await database(this.db, tx).query(`SELECT ${companyFields} FROM empresa WHERE id=1`);
        return company || null;
    }
    async insert(dto: CompanyDto, tx?: TransactionContext) { return database(this.db, tx).query('INSERT INTO empresa(id,nombre,telefono,direccion,correo,nombre_propietario,fecha_creacion,logo_url,nit) VALUES(1,$1,$2,$3,$4,$5,$6,$7,$8)', [dto.nombre, dto.telefono, dto.direccion, dto.correo, dto.nombrePropietario, dto.fechaCreacion, dto.logoUrl || null, dto.nit]); }
    async update(dto: UpdateCompanyDto, tx?: TransactionContext) {
        const mapping: Record<string, unknown> = { nombre: dto.nombre, telefono: dto.telefono, direccion: dto.direccion, correo: dto.correo, nombre_propietario: dto.nombrePropietario, fecha_creacion: dto.fechaCreacion, logo_url: dto.logoUrl, nit: dto.nit };
        const entries = Object.entries(mapping).filter(([, value]) => value !== undefined);
        if (!entries.length)
            return [];
        return database(this.db, tx).query(`UPDATE empresa SET ${entries.map(([key], index) => `${key}=$${index + 1}`).join(',')},updated_at=now() WHERE id=1`, entries.map(([, value]) => value));
    }
}
