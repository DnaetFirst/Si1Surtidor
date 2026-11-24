import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreatePurchaseOrderCommand, UpdatePurchaseOrderCommand, UpdatePurchaseOrderStatusCommand } from '../domain/commands';
import { PurchaseOrderDetailRecord, PurchaseOrderRecord } from '../domain/models';
import { PurchaseOrderRepository } from '../domain/repository';

const orderFields = `
  o.id, o.codigo, o.cantidad, o.fecha, o.hora, o.motivo, o.estado,
  o.id_proveedor AS "idProveedor", p.nombre AS "proveedorNombre", p.nit AS "proveedorNit",
  o.id_sucursal AS "idSucursal", s.nombre AS "sucursalNombre",
  o.ci_usuario AS "ciUsuario", u.nombre AS "usuarioNombre",
  o.created_at AS "createdAt", o.updated_at AS "updatedAt"
`;

const detailFields = `
  d.id, d.id_orden_compra AS "idOrdenCompra", d.id_producto AS "idProducto",
  pr.nombre AS "productoNombre", CAST(pr.id AS text) AS "productoCodigo",
  'Unidades' AS "productoUnidadMedida", d.cantidad
`;

@Injectable()
export class PostgresPurchaseOrderRepository extends PurchaseOrderRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<PurchaseOrderRecord>> {
    const { params, where } = filters(query);
    if (branchId) {
      params.push(branchId);
      where.push(`o.id_sucursal = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(o.codigo ILIKE $${params.length} OR o.motivo ILIKE $${params.length} OR p.nombre ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      orderFields,
      `orden_compra o
       LEFT JOIN proveedor p ON p.id = o.id_proveedor
       JOIN sucursal s ON s.id = o.id_sucursal
       JOIN usuario u ON u.ci = o.ci_usuario`,
      where,
      params,
      query,
      'o.id DESC'
    );

    return {
      items: result.items.map(this.mapOrderRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async findById(id: number, tx?: TransactionContext): Promise<PurchaseOrderRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT ${orderFields}
       FROM orden_compra o
       LEFT JOIN proveedor p ON p.id = o.id_proveedor
       JOIN sucursal s ON s.id = o.id_sucursal
       JOIN usuario u ON u.ci = o.ci_usuario
       WHERE o.id = $1`,
      [id]
    );
    if (!rows.length) return null;

    const order = this.mapOrderRow(rows[0]);
    const details = await database(this.db, tx).query(
      `SELECT ${detailFields}
       FROM detalle_orden_compra d
       JOIN producto pr ON pr.id = d.id_producto
       WHERE d.id_orden_compra = $1
       ORDER BY d.id ASC`,
      [id]
    );
    order.detalles = details.map(this.mapDetailRow);
    return order;
  }

  async findByCode(codigo: string, tx?: TransactionContext): Promise<PurchaseOrderRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT ${orderFields}
       FROM orden_compra o
       LEFT JOIN proveedor p ON p.id = o.id_proveedor
       JOIN sucursal s ON s.id = o.id_sucursal
       JOIN usuario u ON u.ci = o.ci_usuario
       WHERE lower(o.codigo) = lower($1)`,
      [codigo.trim()]
    );
    if (!rows.length) return null;
    return this.findById(rows[0].id, tx);
  }

  async generateNextCode(tx?: TransactionContext): Promise<string> {
    const rows = await database(this.db, tx).query(
      `SELECT count(*)::integer AS total FROM orden_compra`
    );
    const count = (rows[0]?.total ?? 0) + 1;
    return `OC-${String(count).padStart(5, '0')}`;
  }

  async create(cmd: CreatePurchaseOrderCommand, ciUsuario: string, tx?: TransactionContext): Promise<PurchaseOrderRecord> {
    const code = cmd.codigo || (await this.generateNextCode(tx));
    const totalCantidad = cmd.detalles.reduce((acc, d) => acc + Number(d.cantidad || 0), 0);

    const rows = await database(this.db, tx).query(
      `INSERT INTO orden_compra (codigo, cantidad, motivo, estado, id_proveedor, id_sucursal, ci_usuario)
       VALUES ($1, $2, $3, 'PENDIENTE', $4, $5, $6)
       RETURNING id`,
      [code, Math.round(totalCantidad), cmd.motivo || '', cmd.idProveedor || null, cmd.idSucursal, ciUsuario]
    );
    const orderId = Number(rows[0].id);

    for (const d of cmd.detalles) {
      await database(this.db, tx).query(
        `INSERT INTO detalle_orden_compra (id_orden_compra, id_producto, cantidad)
         VALUES ($1, $2, $3)`,
        [orderId, d.idProducto, Number(d.cantidad)]
      );
    }

    const created = await this.findById(orderId, tx);
    return created!;
  }

  async update(id: number, cmd: UpdatePurchaseOrderCommand, tx?: TransactionContext): Promise<PurchaseOrderRecord> {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [];

    if (cmd.motivo !== undefined) {
      params.push(cmd.motivo);
      sets.push(`motivo = $${params.length}`);
    }
    if (cmd.idProveedor !== undefined) {
      params.push(cmd.idProveedor || null);
      sets.push(`id_proveedor = $${params.length}`);
    }
    if (cmd.idSucursal !== undefined) {
      params.push(cmd.idSucursal);
      sets.push(`id_sucursal = $${params.length}`);
    }
    if (cmd.detalles?.length) {
      const totalCantidad = cmd.detalles.reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
      params.push(Math.round(totalCantidad));
      sets.push(`cantidad = $${params.length}`);
    }

    params.push(id);
    await database(this.db, tx).query(
      `UPDATE orden_compra SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params
    );

    if (cmd.detalles?.length) {
      await database(this.db, tx).query(`DELETE FROM detalle_orden_compra WHERE id_orden_compra = $1`, [id]);
      for (const d of cmd.detalles) {
        await database(this.db, tx).query(
          `INSERT INTO detalle_orden_compra (id_orden_compra, id_producto, cantidad)
           VALUES ($1, $2, $3)`,
          [id, d.idProducto, Number(d.cantidad)]
        );
      }
    }

    const updated = await this.findById(id, tx);
    return updated!;
  }

  async updateStatus(id: number, cmd: UpdatePurchaseOrderStatusCommand, tx?: TransactionContext): Promise<PurchaseOrderRecord> {
    await database(this.db, tx).query(
      `UPDATE orden_compra
       SET estado = $1,
           motivo = CASE WHEN $2::text IS NOT NULL AND $2::text != '' THEN $2::text ELSE motivo END,
           updated_at = now()
       WHERE id = $3`,
      [cmd.estado, cmd.motivo || null, id]
    );
    const updated = await this.findById(id, tx);
    return updated!;
  }

  async isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM sucursal WHERE id = $1 AND activo = true`,
      [branchId]
    );
    return !!row;
  }

  async isProviderActive(providerId: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM proveedor WHERE id = $1 AND activo = true`,
      [providerId]
    );
    return !!row;
  }

  async isProductActive(productId: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM producto WHERE id = $1 AND esta_activo = true`,
      [productId]
    );
    return !!row;
  }

  async hasReceipts(id: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM nota_compra WHERE id_orden = $1 LIMIT 1`,
      [id]
    );
    return !!row;
  }

  private mapOrderRow(row: any): PurchaseOrderRecord {
    return {
      id: Number(row.id),
      codigo: row.codigo,
      cantidad: Number(row.cantidad || 0),
      fecha: typeof row.fecha === 'string' ? row.fecha : row.fecha?.toISOString?.()?.split('T')[0] ?? '',
      hora: row.hora || '',
      motivo: row.motivo || '',
      estado: row.estado,
      idProveedor: row.idProveedor ? Number(row.idProveedor) : null,
      proveedorNombre: row.proveedorNombre || null,
      proveedorNit: row.proveedorNit || null,
      idSucursal: Number(row.idSucursal),
      sucursalNombre: row.sucursalNombre || '',
      ciUsuario: row.ciUsuario,
      usuarioNombre: row.usuarioNombre || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapDetailRow(row: any): PurchaseOrderDetailRecord {
    return {
      id: Number(row.id),
      idOrdenCompra: Number(row.idOrdenCompra),
      idProducto: Number(row.idProducto),
      productoNombre: row.productoNombre,
      productoCodigo: row.productoCodigo,
      productoUnidadMedida: row.productoUnidadMedida,
      cantidad: Number(row.cantidad),
    };
  }
}
