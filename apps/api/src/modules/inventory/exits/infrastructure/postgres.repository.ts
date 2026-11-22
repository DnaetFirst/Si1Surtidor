import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreateProductExitCommand } from '../domain/commands';
import { ProductExitRecord } from '../domain/models';
import { ProductExitRepository } from '../domain/repository';

const exitFields = `
  sp.id, sp.motivo, sp.cantidad, sp.fecha,
  sp.id_lote AS "idLote", l.codigo AS "loteCodigo",
  sp.id_producto AS "idProducto", pr.nombre AS "productoNombre", CAST(pr.id AS text) AS "productoCodigo",
  pr.id_sucursal AS "idSucursal", s.nombre AS "sucursalNombre"
`;

@Injectable()
export class PostgresProductExitRepository extends ProductExitRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<ProductExitRecord>> {
    const { params, where } = filters(query);
    if (branchId) {
      params.push(branchId);
      where.push(`pr.id_sucursal = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(sp.motivo ILIKE $${params.length} OR pr.nombre ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      exitFields,
      `salida_producto sp
       JOIN producto pr ON pr.id = sp.id_producto
       LEFT JOIN lote l ON l.id = sp.id_lote
       LEFT JOIN sucursal s ON s.id = pr.id_sucursal`,
      where,
      params,
      query,
      'sp.id DESC'
    );

    return {
      items: result.items.map(this.mapRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async findById(id: number, tx?: TransactionContext): Promise<ProductExitRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT ${exitFields}
       FROM salida_producto sp
       JOIN producto pr ON pr.id = sp.id_producto
       LEFT JOIN lote l ON l.id = sp.id_lote
       LEFT JOIN sucursal s ON s.id = pr.id_sucursal
       WHERE sp.id = $1`,
      [id]
    );
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async create(cmd: CreateProductExitCommand, tx?: TransactionContext, userCi?: string): Promise<ProductExitRecord> {
    const rows = await database(this.db, tx).query(
      `INSERT INTO salida_producto (motivo, cantidad, id_lote, id_producto, ci_usuario, id_sucursal)
       VALUES ($1, $2, $3, $4, $5, (SELECT id_sucursal FROM producto WHERE id = $4))
       RETURNING id`,
      [cmd.motivo.trim(), cmd.cantidad, cmd.idLote || null, cmd.idProducto, userCi || null]
    );
    const exitId = Number(rows[0].id);

    // Deduct stock from product
    await database(this.db, tx).query(
      `UPDATE producto
       SET stock = GREATEST(0, stock - $1),
           updated_at = now()
       WHERE id = $2`,
      [cmd.cantidad, cmd.idProducto]
    );

    // If batch specified, deduct batch stock
    if (cmd.idLote) {
      await database(this.db, tx).query(
        `UPDATE lote
         SET stock = GREATEST(0, stock - $1)
         WHERE id = $2`,
        [cmd.cantidad, cmd.idLote]
      );
    }

    const created = await this.findById(exitId, tx);
    return created!;
  }

  private mapRow(row: any): ProductExitRecord {
    return {
      id: Number(row.id),
      motivo: row.motivo,
      cantidad: Number(row.cantidad),
      fecha: row.fecha,
      idLote: row.idLote ? Number(row.idLote) : null,
      loteCodigo: row.loteCodigo || null,
      idProducto: Number(row.idProducto),
      productoNombre: row.productoNombre,
      productoCodigo: row.productoCodigo,
      idSucursal: row.idSucursal ? Number(row.idSucursal) : null,
      sucursalNombre: row.sucursalNombre || null,
    };
  }
}
