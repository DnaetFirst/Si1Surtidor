import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CreateCategoryCommand, CreateGroupCommand, UpdateCategoryCommand, UpdateGroupCommand } from '../domain/commands';
import { Category, Group } from '../domain/models';
import { CategoryGroupRepository } from '../domain/repository';

const categoryFields = 'id, nombre, descripcion, imagen_url AS "imagenUrl", activo, created_at AS "createdAt", updated_at AS "updatedAt"';
const groupFields = 'id, nombre, descripcion, activo, created_at AS "createdAt", updated_at AS "updatedAt"';

@Injectable()
export class PostgresCategoryGroupRepository extends CategoryGroupRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async listCategories(tx?: TransactionContext): Promise<Category[]> {
    return database(this.db, tx).query(`SELECT ${categoryFields} FROM categoria ORDER BY id ASC`);
  }

  async findCategoryById(id: number, tx?: TransactionContext): Promise<Category | null> {
    const [item] = await database(this.db, tx).query(`SELECT ${categoryFields} FROM categoria WHERE id = $1`, [id]);
    return item || null;
  }

  async findCategoryByName(name: string, tx?: TransactionContext): Promise<Category | null> {
    const [item] = await database(this.db, tx).query(`SELECT ${categoryFields} FROM categoria WHERE lower(nombre) = lower($1)`, [name]);
    return item || null;
  }

  async createCategory(data: CreateCategoryCommand, tx?: TransactionContext): Promise<Category> {
    const [created] = await database(this.db, tx).query(
      `INSERT INTO categoria(nombre, descripcion, imagen_url, activo)
       VALUES($1, $2, $3, $4)
       RETURNING ${categoryFields}`,
      [data.nombre, data.descripcion || '', data.imagenUrl || '', data.activo ?? true]
    );
    return created;
  }

  async updateCategory(id: number, data: UpdateCategoryCommand, tx?: TransactionContext): Promise<Category> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      updates.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      updates.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.imagenUrl !== undefined) {
      updates.push(`imagen_url = $${idx++}`);
      values.push(data.imagenUrl);
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    await database(this.db, tx).query(
      `UPDATE categoria SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
    const updated = await this.findCategoryById(id, tx);
    return updated!;
  }

  async deleteCategory(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(`DELETE FROM categoria WHERE id = $1`, [id]);
  }

  async countProductsInCategory(categoryId: number, tx?: TransactionContext): Promise<number> {
    const [result] = await database(this.db, tx).query(
      `SELECT count(*)::int AS count FROM producto WHERE id_categoria = $1`,
      [categoryId]
    );
    return result?.count || 0;
  }

  async listGroups(tx?: TransactionContext): Promise<Group[]> {
    return database(this.db, tx).query(`SELECT ${groupFields} FROM grupo ORDER BY id ASC`);
  }

  async findGroupById(id: number, tx?: TransactionContext): Promise<Group | null> {
    const [item] = await database(this.db, tx).query(`SELECT ${groupFields} FROM grupo WHERE id = $1`, [id]);
    return item || null;
  }

  async findGroupByName(name: string, tx?: TransactionContext): Promise<Group | null> {
    const [item] = await database(this.db, tx).query(`SELECT ${groupFields} FROM grupo WHERE lower(nombre) = lower($1)`, [name]);
    return item || null;
  }

  async createGroup(data: CreateGroupCommand, tx?: TransactionContext): Promise<Group> {
    const [created] = await database(this.db, tx).query(
      `INSERT INTO grupo(nombre, descripcion, activo)
       VALUES($1, $2, $3)
       RETURNING ${groupFields}`,
      [data.nombre, data.descripcion || '', data.activo ?? true]
    );
    return created;
  }

  async updateGroup(id: number, data: UpdateGroupCommand, tx?: TransactionContext): Promise<Group> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      updates.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      updates.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    await database(this.db, tx).query(
      `UPDATE grupo SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
    const updated = await this.findGroupById(id, tx);
    return updated!;
  }

  async deleteGroup(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(`DELETE FROM grupo WHERE id = $1`, [id]);
  }

  async countProductsInGroup(groupId: number, tx?: TransactionContext): Promise<number> {
    const [result] = await database(this.db, tx).query(
      `SELECT count(*)::int AS count FROM grupo_producto WHERE id_grupo = $1`,
      [groupId]
    );
    return result?.count || 0;
  }
}
