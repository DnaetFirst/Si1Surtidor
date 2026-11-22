import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreateProviderCommand, LinkProductCommand, UpdateProviderCommand } from '../domain/commands';
import { ProviderProductRecord, ProviderRecord } from '../domain/models';
import { ProviderRepository } from '../domain/repository';

const providerFields = `
  id, nombre, razon_social AS "razonSocial", nit, contacto, telefono, correo, direccion, detalle, activo,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

@Injectable()
export class PostgresProviderRepository extends ProviderRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery): Promise<PageResult<ProviderRecord>> {
    const { params, where } = filters(query);
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(nombre ILIKE $${params.length} OR razon_social ILIKE $${params.length} OR nit ILIKE $${params.length} OR contacto ILIKE $${params.length} OR correo ILIKE $${params.length})`);
    }
    return page(this.db, providerFields, 'proveedor', where, params, query, 'id DESC');
  }

  async findById(id: number, tx?: TransactionContext): Promise<ProviderRecord | null> {
    const [item] = await database(this.db, tx).query(
      `SELECT ${providerFields} FROM proveedor WHERE id = $1`,
      [id]
    );
    if (!item) return null;
    item.productos = await this.getProducts(id, tx);
    return item;
  }

  async findByNit(nit: string, tx?: TransactionContext): Promise<ProviderRecord | null> {
    const [item] = await database(this.db, tx).query(
      `SELECT ${providerFields} FROM proveedor WHERE lower(btrim(nit)) = lower(btrim($1))`,
      [nit]
    );
    return item || null;
  }

  async duplicate(nit: string, exceptId: number | null, tx?: TransactionContext): Promise<boolean> {
    const [item] = await database(this.db, tx).query(
      `SELECT 1 FROM proveedor WHERE lower(btrim(nit)) = lower(btrim($1)) AND ($2::int IS NULL OR id <> $2)`,
      [nit, exceptId]
    );
    return !!item;
  }

  async create(data: CreateProviderCommand, tx: TransactionContext): Promise<ProviderRecord> {
    const [item] = await database(this.db, tx).query(
      `INSERT INTO proveedor (nombre, razon_social, nit, contacto, telefono, correo, direccion, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${providerFields}`,
      [
        data.nombre,
        data.razonSocial || data.nombre,
        data.nit,
        data.contacto || '',
        data.telefono || '',
        data.correo || '',
        data.direccion || '',
        data.detalle || '',
      ]
    );
    return item;
  }

  async update(id: number, data: UpdateProviderCommand, tx: TransactionContext): Promise<ProviderRecord> {
    const map: Record<string, unknown> = {
      nombre: data.nombre,
      razon_social: data.razonSocial,
      nit: data.nit,
      contacto: data.contacto,
      telefono: data.telefono,
      correo: data.correo,
      direccion: data.direccion,
      detalle: data.detalle,
      activo: data.activo,
      updated_at: new Date(),
    };

    const entries = Object.entries(map).filter(([, val]) => val !== undefined);
    if (entries.length) {
      await database(this.db, tx).query(
        `UPDATE proveedor SET ${entries.map(([key], i) => `${key} = $${i + 1}`).join(', ')} WHERE id = $${entries.length + 1}`,
        [...entries.map(([, val]) => val), id]
      );
    }
    return (await this.findById(id, tx))!;
  }

  async disable(id: number, tx: TransactionContext): Promise<ProviderRecord> {
    await database(this.db, tx).query(
      `UPDATE proveedor SET activo = false, updated_at = now() WHERE id = $1`,
      [id]
    );
    return (await this.findById(id, tx))!;
  }

  async toggleStatus(id: number, tx: TransactionContext): Promise<ProviderRecord> {
    await database(this.db, tx).query(
      `UPDATE proveedor SET activo = NOT activo, updated_at = now() WHERE id = $1`,
      [id]
    );
    return (await this.findById(id, tx))!;
  }

  async getProducts(providerId: number, tx?: TransactionContext): Promise<ProviderProductRecord[]> {
    return database(this.db, tx).query(
      `SELECT
         pp.id, pp.detalle, pp.ultimo_precio AS "ultimoPrecio",
         pp.id_proveedor AS "idProveedor", pp.id_producto AS "idProducto",
         p.nombre AS "productoNombre", pp.activo, pp.created_at AS "createdAt"
       FROM proveedor_producto pp
       JOIN producto p ON p.id = pp.id_producto
       WHERE pp.id_proveedor = $1 AND pp.activo = true
       ORDER BY p.nombre ASC`,
      [providerId]
    );
  }

  async linkProduct(providerId: number, data: LinkProductCommand, tx: TransactionContext): Promise<ProviderProductRecord> {
    const [item] = await database(this.db, tx).query(
      `INSERT INTO proveedor_producto (id_proveedor, id_producto, ultimo_precio, detalle)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_proveedor, id_producto)
       DO UPDATE SET ultimo_precio = EXCLUDED.ultimo_precio, detalle = EXCLUDED.detalle, activo = true
       RETURNING id, detalle, ultimo_precio AS "ultimoPrecio", id_proveedor AS "idProveedor", id_producto AS "idProducto", activo, created_at AS "createdAt"`,
      [providerId, data.idProducto, data.ultimoPrecio, data.detalle || '']
    );
    return item;
  }

  async unlinkProduct(providerId: number, productId: number, tx: TransactionContext): Promise<void> {
    await database(this.db, tx).query(
      `UPDATE proveedor_producto SET activo = false WHERE id_proveedor = $1 AND id_producto = $2`,
      [providerId, productId]
    );
  }

  async hasOrdersOrPurchases(id: number, tx?: TransactionContext): Promise<boolean> {
    const [order] = await database(this.db, tx).query(`SELECT 1 FROM orden_compra WHERE id_proveedor = $1 LIMIT 1`, [id]);
    if (order) return true;
    const [purchase] = await database(this.db, tx).query(`SELECT 1 FROM nota_compra WHERE id_proveedor = $1 LIMIT 1`, [id]);
    return !!purchase;
  }
}
