import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreatePurchaseReceiptCommand } from '../domain/commands';
import { BatchRecord, PurchaseReceiptDetailRecord, PurchaseReceiptRecord } from '../domain/models';
import { PurchaseReceiptRepository } from '../domain/repository';

const receiptFields = `
  nc.id, nc.codigo, nc.motivo, nc.monto_total AS "montoTotal", nc.moneda,
  nc.fecha, nc.hora, nc.id_proveedor AS "idProveedor", p.nombre AS "proveedorNombre", p.nit AS "proveedorNit",
  nc.id_sucursal AS "idSucursal", s.nombre AS "sucursalNombre",
  nc.id_orden AS "idOrden", oc.codigo AS "ordenCodigo",
  nc.ci_usuario AS "ciUsuario", u.nombre AS "usuarioNombre",
  nc.created_at AS "createdAt"
`;

const detailFields = `
  d.id, d.id_nota_compra AS "idNotaCompra", d.id_producto AS "idProducto",
  pr.nombre AS "productoNombre", CAST(pr.id AS text) AS "productoCodigo",
  'Unidades' AS "productoUnidadMedida",
  d.id_lote AS "idLote", l.codigo AS "loteCodigo",
  d.cantidad, d.precio, d.subtotal
`;

const batchFields = `
  l.id, l.codigo, l.fecha_vencimiento AS "fechaVencimiento", l.detalle,
  l.stock, l.stock_inicial AS "stockInicial", l.esta_activo AS "estaActivo",
  l.id_producto AS "idProducto", pr.nombre AS "productoNombre",
  l.id_proveedor_producto AS "idProveedorProducto", l.created_at AS "createdAt"
`;

@Injectable()
export class PostgresPurchaseReceiptRepository extends PurchaseReceiptRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<PurchaseReceiptRecord>> {
    const { params, where } = filters(query);
    if (branchId) {
      params.push(branchId);
      where.push(`nc.id_sucursal = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(nc.codigo ILIKE $${params.length} OR nc.motivo ILIKE $${params.length} OR p.nombre ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      receiptFields,
      `nota_compra nc
       LEFT JOIN proveedor p ON p.id = nc.id_proveedor
       LEFT JOIN sucursal s ON s.id = nc.id_sucursal
       LEFT JOIN orden_compra oc ON oc.id = nc.id_orden
       JOIN usuario u ON u.ci = nc.ci_usuario`,
      where,
      params,
      query,
      'nc.id DESC'
    );

    return {
      items: result.items.map(this.mapReceiptRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async findById(id: number, tx?: TransactionContext): Promise<PurchaseReceiptRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT ${receiptFields}
       FROM nota_compra nc
       LEFT JOIN proveedor p ON p.id = nc.id_proveedor
       LEFT JOIN sucursal s ON s.id = nc.id_sucursal
       LEFT JOIN orden_compra oc ON oc.id = nc.id_orden
       JOIN usuario u ON u.ci = nc.ci_usuario
       WHERE nc.id = $1`,
      [id]
    );
    if (!rows.length) return null;

    const receipt = this.mapReceiptRow(rows[0]);
    const details = await database(this.db, tx).query(
      `SELECT ${detailFields}
       FROM detalle_compra d
       JOIN producto pr ON pr.id = d.id_producto
       LEFT JOIN lote l ON l.id = d.id_lote
       WHERE d.id_nota_compra = $1
       ORDER BY d.id ASC`,
      [id]
    );
    receipt.detalles = details.map(this.mapDetailRow);
    return receipt;
  }

  async findByCode(codigo: string, tx?: TransactionContext): Promise<PurchaseReceiptRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT id FROM nota_compra WHERE lower(codigo) = lower($1)`,
      [codigo.trim()]
    );
    if (!rows.length) return null;
    return this.findById(rows[0].id, tx);
  }

  async generateNextCode(tx?: TransactionContext): Promise<string> {
    const rows = await database(this.db, tx).query(`SELECT count(*)::integer AS total FROM nota_compra`);
    const count = (rows[0]?.total ?? 0) + 1;
    return `NC-${String(count).padStart(5, '0')}`;
  }

  async create(cmd: CreatePurchaseReceiptCommand, ciUsuario: string, tx?: TransactionContext): Promise<PurchaseReceiptRecord> {
    const code = cmd.codigo || (await this.generateNextCode(tx));
    const total = cmd.detalles.reduce((acc, d) => acc + (Number(d.cantidad) * Number(d.precio)), 0);

    const rows = await database(this.db, tx).query(
      `INSERT INTO nota_compra (codigo, motivo, monto_total, moneda, id_proveedor, id_sucursal, id_orden, ci_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        code,
        cmd.motivo || '',
        total,
        cmd.moneda || 'BOB',
        cmd.idProveedor || null,
        cmd.idSucursal || null,
        cmd.idOrden || null,
        ciUsuario,
      ]
    );
    const receiptId = Number(rows[0].id);

    // If linked to an order, update order status to RECIBIDA
    if (cmd.idOrden) {
      await database(this.db, tx).query(
        `UPDATE orden_compra SET estado = 'RECIBIDA', updated_at = now() WHERE id = $1`,
        [cmd.idOrden]
      );
    }

    for (let i = 0; i < cmd.detalles.length; i++) {
      const d = cmd.detalles[i];
      const batchCode = d.loteCodigo || `LOT-${code}-${i + 1}`;
      const qty = Number(d.cantidad);
      const prc = Number(d.precio);
      const sub = qty * prc;

      // Create batch (lote)
      const loteRows = await database(this.db, tx).query(
        `INSERT INTO lote (codigo, fecha_vencimiento, detalle, stock, stock_inicial, esta_activo, id_producto)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         RETURNING id`,
        [batchCode, d.fechaVencimiento || null, d.loteDetalle || '', qty, qty, d.idProducto]
      );
      const loteId = Number(loteRows[0].id);

      // Insert detail (trigger trg_actualizar_stock_compra updates producto.stock automatically)
      await database(this.db, tx).query(
        `INSERT INTO detalle_compra (cantidad, precio, subtotal, id_nota_compra, id_lote, id_producto)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [qty, prc, sub, receiptId, loteId, d.idProducto]
      );
    }

    const created = await this.findById(receiptId, tx);
    return created!;
  }

  async listBatches(query: ListQuery, productId?: number, tx?: TransactionContext): Promise<PageResult<BatchRecord>> {
    const { params, where } = filters(query);
    if (productId) {
      params.push(productId);
      where.push(`l.id_producto = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(l.codigo ILIKE $${params.length} OR pr.nombre ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      batchFields,
      `lote l JOIN producto pr ON pr.id = l.id_producto`,
      where,
      params,
      query,
      'l.id DESC'
    );

    return {
      items: result.items.map(this.mapBatchRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  private mapReceiptRow(row: any): PurchaseReceiptRecord {
    return {
      id: Number(row.id),
      codigo: row.codigo,
      motivo: row.motivo || '',
      montoTotal: Number(row.montoTotal || 0),
      moneda: row.moneda || 'BOB',
      fecha: typeof row.fecha === 'string' ? row.fecha : row.fecha?.toISOString?.()?.split('T')[0] ?? '',
      hora: row.hora || '',
      idProveedor: row.idProveedor ? Number(row.idProveedor) : null,
      proveedorNombre: row.proveedorNombre || null,
      proveedorNit: row.proveedorNit || null,
      idSucursal: row.idSucursal ? Number(row.idSucursal) : null,
      sucursalNombre: row.sucursalNombre || null,
      idOrden: row.idOrden ? Number(row.idOrden) : null,
      ordenCodigo: row.ordenCodigo || null,
      ciUsuario: row.ciUsuario,
      usuarioNombre: row.usuarioNombre || '',
      createdAt: row.createdAt,
    };
  }

  private mapDetailRow(row: any): PurchaseReceiptDetailRecord {
    return {
      id: Number(row.id),
      idNotaCompra: Number(row.idNotaCompra),
      idProducto: Number(row.idProducto),
      productoNombre: row.productoNombre,
      productoCodigo: row.productoCodigo,
      productoUnidadMedida: row.productoUnidadMedida,
      idLote: row.idLote ? Number(row.idLote) : null,
      loteCodigo: row.loteCodigo || null,
      cantidad: Number(row.cantidad),
      precio: Number(row.precio),
      subtotal: Number(row.subtotal),
    };
  }

  private mapBatchRow(row: any): BatchRecord {
    return {
      id: Number(row.id),
      codigo: row.codigo,
      codigoLote: row.codigo,
      fechaVencimiento: typeof row.fechaVencimiento === 'string' ? row.fechaVencimiento : row.fechaVencimiento?.toISOString?.()?.split('T')[0] ?? null,
      detalle: row.detalle || '',
      stock: Number(row.stock),
      stockInicial: Number(row.stockInicial),
      estaActivo: Boolean(row.estaActivo),
      idProducto: Number(row.idProducto),
      productoNombre: row.productoNombre,
      idProveedorProducto: row.idProveedorProducto ? Number(row.idProveedorProducto) : null,
      createdAt: row.createdAt,
    };
  }
}
