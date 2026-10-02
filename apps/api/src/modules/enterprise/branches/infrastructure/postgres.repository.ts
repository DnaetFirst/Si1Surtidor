import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BranchesRepository } from '../domain/repository';
@Injectable()
export class PostgresBranchesRepository extends BranchesRepository {
    constructor(private readonly db: DataSource) { super(); }
    branches() { return this.db.query('SELECT id,nombre,direccion,telefono,correo,id_empresa AS "empresaId" FROM sucursal WHERE activo=true ORDER BY nombre,id'); }
}
