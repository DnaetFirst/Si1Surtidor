import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { CreateProductCommand, UpdateProductCommand } from '../domain/commands';
import { Product } from '../domain/models';
import { ProductRepository } from '../domain/repository';

const selectProductSql = `
  SELECT
    p.id, p.nombre, p.stock, p.stock_minimo AS "stockMinimo", p.descripcion,
    p.precio_venta AS "precioVenta", p.precio_compra AS "precioCompra", p.iva,
    p.url_image AS "urlImage", p.esta_activo AS "estaActivo", p.descuento,
    p.id_categoria AS "idCategoria", c.nombre AS "categoriaNombre",
    p.id_sucursal AS "idSucursal", s.nombre AS "sucursalNombre",
    p.created_at AS "createdAt", p.updated_at AS "updatedAt",
    COALESCE(
      (SELECT array_agg(gp.id_grupo) FROM grupo_producto gp WHERE gp.id_producto = p.id),
      ARRAY[]::integer[]
    ) AS grupos
  FROM producto p
  LEFT JOIN categoria c ON p.id_categoria = c.id
  LEFT JOIN sucursal s ON p.id_sucursal = s.id
`;

@Injectable()
export class PostgresProductRepository extends ProductRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(tx?: TransactionContext): Promise<Product[]> {
    return database(this.db, tx).query(`${selectProductSql} ORDER BY p.id ASC`);
  }

  async findById(id: number, tx?: TransactionContext): Promise<Product | null> {
    const [item] = await database(this.db, tx).query(`${selectProductSql} WHERE p.id = $1`, [id]);
    return item || null;
  }

  async findByName(name: string, tx?: TransactionContext): Promise<Product | null> {
    const [item] = await database(this.db, tx).query(`${selectProductSql} WHERE lower(p.nombre) = lower($1)`, [name]);
    return item || null;
  }

  async categoryExists(id: number, tx?: TransactionContext): Promise<boolean> {
    const [res] = await database(this.db, tx).query(`SELECT 1 FROM categoria WHERE id = $1`, [id]);
    return !!res;
  }

  async sucursalExists(id: number, tx?: TransactionContext): Promise<boolean> {
    const [res] = await database(this.db, tx).query(`SELECT 1 FROM sucursal WHERE id = $1 AND activo=true`, [id]);
    return !!res;
  }

  async create(data: CreateProductCommand, tx?: TransactionContext): Promise<Product> {
    const sucursalId = data.idSucursal ?? null;
    const [created] = await database(this.db, tx).query(
      `INSERT INTO producto(
        nombre, stock, stock_minimo, descripcion, precio_venta, precio_compra,
        iva, url_image, esta_activo, descuento, id_categoria, id_sucursal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        data.nombre,
        data.stock ?? 0,
        data.stockMinimo ?? 0,
        data.descripcion || '',
        data.precioVenta,
        data.precioCompra ?? 0,
        data.iva ?? 0,
        data.urlImage || '',
        data.estaActivo ?? true,
        data.descuento ?? 0,
        data.idCategoria,
        sucursalId,
      ]
    );

    if (data.grupos && data.grupos.length > 0) {
      for (const gid of data.grupos) {
        await database(this.db, tx).query(
          `INSERT INTO grupo_producto(id_grupo, id_producto) VALUES($1, $2) ON CONFLICT DO NOTHING`,
          [gid, created.id]
        );
      }
    }

    const result = await this.findById(created.id, tx);
    return result!;
  }

  async update(id: number, data: UpdateProductCommand, tx?: TransactionContext): Promise<Product> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      updates.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.stock !== undefined) {
      updates.push(`stock = $${idx++}`);
      values.push(data.stock);
    }
    if (data.stockMinimo !== undefined) {
      updates.push(`stock_minimo = $${idx++}`);
      values.push(data.stockMinimo);
    }
    if (data.descripcion !== undefined) {
      updates.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.precioVenta !== undefined) {
      updates.push(`precio_venta = $${idx++}`);
      values.push(data.precioVenta);
    }
    if (data.precioCompra !== undefined) {
      updates.push(`precio_compra = $${idx++}`);
      values.push(data.precioCompra);
    }
    if (data.iva !== undefined) {
      updates.push(`iva = $${idx++}`);
      values.push(data.iva);
    }
    if (data.urlImage !== undefined) {
      updates.push(`url_image = $${idx++}`);
      values.push(data.urlImage);
    }
    if (data.estaActivo !== undefined) {
      updates.push(`esta_activo = $${idx++}`);
      values.push(data.estaActivo);
    }
    if (data.descuento !== undefined) {
      updates.push(`descuento = $${idx++}`);
      values.push(data.descuento);
    }
    if (data.idCategoria !== undefined) {
      updates.push(`id_categoria = $${idx++}`);
      values.push(data.idCategoria);
    }
    if (data.idSucursal !== undefined) {
      updates.push(`id_sucursal = $${idx++}`);
      values.push(data.idSucursal);
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    await database(this.db, tx).query(
      `UPDATE producto SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    if (data.grupos !== undefined) {
      await database(this.db, tx).query(`DELETE FROM grupo_producto WHERE id_producto = $1`, [id]);
      for (const gid of data.grupos) {
        await database(this.db, tx).query(
          `INSERT INTO grupo_producto(id_grupo, id_producto) VALUES($1, $2) ON CONFLICT DO NOTHING`,
          [gid, id]
        );
      }
    }

    const result = await this.findById(id, tx);
    return result!;
  }

  async delete(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(`DELETE FROM producto WHERE id = $1`, [id]);
  }
}
