import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CreateFuelCommand, UpdateFuelCommand } from '../domain/commands';
import { Fuel } from '../domain/models';
import { FuelRepository } from '../domain/repository';

const fuelFields = 'id, tipo, octanaje, nombre, descripcion, esta_activo AS "estaActivo", created_at AS "createdAt", updated_at AS "updatedAt"';

@Injectable()
export class PostgresFuelRepository extends FuelRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(tx?: TransactionContext): Promise<Fuel[]> {
    return database(this.db, tx).query(`SELECT ${fuelFields} FROM combustible ORDER BY id ASC`);
  }

  async findById(id: number, tx?: TransactionContext): Promise<Fuel | null> {
    const [fuel] = await database(this.db, tx).query(`SELECT ${fuelFields} FROM combustible WHERE id = $1`, [id]);
    return fuel || null;
  }

  async findByName(name: string, tx?: TransactionContext): Promise<Fuel | null> {
    const [fuel] = await database(this.db, tx).query(`SELECT ${fuelFields} FROM combustible WHERE lower(nombre) = lower($1)`, [name]);
    return fuel || null;
  }

  async create(data: CreateFuelCommand, tx?: TransactionContext): Promise<Fuel> {
    const [created] = await database(this.db, tx).query(
      `INSERT INTO combustible(tipo, octanaje, nombre, descripcion, esta_activo)
       VALUES($1, $2, $3, $4, $5)
       RETURNING ${fuelFields}`,
      [data.tipo, data.octanaje, data.nombre, data.descripcion || '', data.estaActivo ?? true]
    );
    return created;
  }

  async update(id: number, data: UpdateFuelCommand, tx?: TransactionContext): Promise<Fuel> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.tipo !== undefined) {
      updates.push(`tipo = $${idx++}`);
      values.push(data.tipo);
    }
    if (data.octanaje !== undefined) {
      updates.push(`octanaje = $${idx++}`);
      values.push(data.octanaje);
    }
    if (data.nombre !== undefined) {
      updates.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      updates.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.estaActivo !== undefined) {
      updates.push(`esta_activo = $${idx++}`);
      values.push(data.estaActivo);
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    await database(this.db, tx).query(
      `UPDATE combustible SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
    const updated = await this.findById(id, tx);
    return updated!;
  }

  async delete(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(`DELETE FROM combustible WHERE id = $1`, [id]);
  }
}
