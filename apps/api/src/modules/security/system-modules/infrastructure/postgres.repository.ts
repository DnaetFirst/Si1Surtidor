import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CreateSystemModuleCommand, UpdateSystemModuleCommand } from '../domain/commands';
import { SystemModule } from '../domain/models';
import { SystemModuleRepository } from '../domain/repository';

const moduleFields = 'id, codigo, nombre, descripcion, activo, created_at AS "createdAt", updated_at AS "updatedAt"';

@Injectable()
export class PostgresSystemModuleRepository extends SystemModuleRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(tx?: TransactionContext): Promise<SystemModule[]> {
    return database(this.db, tx).query(`SELECT ${moduleFields} FROM modulo_sistema ORDER BY id ASC`);
  }

  async findById(id: number, tx?: TransactionContext): Promise<SystemModule | null> {
    const [item] = await database(this.db, tx).query(`SELECT ${moduleFields} FROM modulo_sistema WHERE id = $1`, [id]);
    return item || null;
  }

  async findByCode(code: string, tx?: TransactionContext): Promise<SystemModule | null> {
    const [item] = await database(this.db, tx).query(`SELECT ${moduleFields} FROM modulo_sistema WHERE lower(codigo) = lower($1)`, [code]);
    return item || null;
  }

  async create(data: CreateSystemModuleCommand, tx?: TransactionContext): Promise<SystemModule> {
    const [created] = await database(this.db, tx).query(
      `INSERT INTO modulo_sistema(codigo, nombre, descripcion, activo)
       VALUES($1, $2, $3, $4)
       RETURNING ${moduleFields}`,
      [data.codigo.trim().toLowerCase(), data.nombre.trim(), data.descripcion || '', data.activo ?? true]
    );
    return created;
  }

  async update(id: number, data: UpdateSystemModuleCommand, tx?: TransactionContext): Promise<SystemModule> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.codigo !== undefined) {
      updates.push(`codigo = $${idx++}`);
      values.push(data.codigo.trim().toLowerCase());
    }
    if (data.nombre !== undefined) {
      updates.push(`nombre = $${idx++}`);
      values.push(data.nombre.trim());
    }
    if (data.descripcion !== undefined) {
      updates.push(`descripcion = $${idx++}`);
      values.push(data.descripcion.trim());
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    await database(this.db, tx).query(
      `UPDATE modulo_sistema SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
    const result = await this.findById(id, tx);
    return result!;
  }

  async delete(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(`DELETE FROM modulo_sistema WHERE id = $1`, [id]);
  }
}
