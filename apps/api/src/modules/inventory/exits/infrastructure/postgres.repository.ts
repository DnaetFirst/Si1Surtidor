import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { ConflictException } from '../../../../shared/domain/errors';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreateProductExitCommand } from '../domain/commands';
import { ProductExitRecord } from '../domain/models';
import { ProductExitRepository } from '../domain/repository';

const exitFields = `
  sp.id, sp.motivo, sp.cantidad, sp.fecha,
  sp.estado, sp.documento_origen AS "documentoOrigen", sp.referencia_reversion AS "referenciaReversion",
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

  async validateAvailability(cmd: CreateProductExitCommand, tx?: TransactionContext): Promise<void> {
    const [prod] = await database(this.db, tx).query(
      `SELECT id, nombre, stock, esta_activo FROM producto WHERE id = $1 FOR UPDATE`,
      [cmd.idProducto]
    );
    if (!prod || !prod.esta_activo) {
      throw new ConflictException('El producto seleccionado no existe o está inactivo.');
    }
    if (Number(prod.stock) < Number(cmd.cantidad)) {
      throw new ConflictException(`Stock insuficiente para ${prod.nombre}: disponible ${prod.stock}, solicitado ${cmd.cantidad}.`);
    }
    if (cmd.idLote) {
      const [lote] = await database(this.db, tx).query(
        `SELECT id, codigo, stock, id_producto FROM lote WHERE id = $1 FOR UPDATE`,
        [cmd.idLote]
      );
      if (!lote) {
        throw new ConflictException('El lote especificado no existe.');
      }
      if (Number(lote.id_producto) !== Number(cmd.idProducto)) {
        throw new ConflictException('El lote indicado no corresponde al producto seleccionado.');
      }
      if (Number(lote.stock) < Number(cmd.cantidad)) {
        throw new ConflictException(`Stock insuficiente en el lote ${lote.codigo}: disponible ${lote.stock}.`);
      }
    }
  }

  async create(cmd: CreateProductExitCommand, tx?: TransactionContext, userCi?: string): Promise<ProductExitRecord> {
    const rows = await database(this.db, tx).query(
      `INSERT INTO salida_producto (motivo, cantidad, estado, documento_origen, id_lote, id_producto, ci_usuario, id_sucursal)
       VALUES ($1, $2, 'CONFIRMADA', $3, $4, $5, $6, (SELECT id_sucursal FROM producto WHERE id = $5))
       RETURNING id`,
      [cmd.motivo.trim(), cmd.cantidad, cmd.documentoOrigen || null, cmd.idLote || null, cmd.idProducto, userCi || null]
    );
    const exitId = Number(rows[0].id);

    // Deduct stock from product
    await database(this.db, tx).query(
      `UPDATE producto
       SET stock = stock - $1,
           updated_at = now()
       WHERE id = $2`,
      [cmd.cantidad, cmd.idProducto]
    );

    // If batch specified, deduct batch stock
    if (cmd.idLote) {
      await database(this.db, tx).query(
        `UPDATE lote
         SET stock = stock - $1
         WHERE id = $2`,
        [cmd.cantidad, cmd.idLote]
      );
    }

    const created = await this.findById(exitId, tx);
    return created!;
  }

  async revert(id: number, tx?: TransactionContext, userCi?: string): Promise<ProductExitRecord> {
    const existing = await this.findById(id, tx);
    if (!existing) throw new ConflictException('Salida de producto no encontrada.');
    if (existing.estado === 'REVERTIDA' || existing.estado === 'REVERSA') {
      throw new ConflictException('Esta salida ya fue revertida o corresponde a un movimiento inverso.');
    }

    await database(this.db, tx).query(
      `UPDATE salida_producto SET estado = 'REVERTIDA' WHERE id = $1`,
      [id]
    );

    await database(this.db, tx).query(
      `UPDATE producto SET stock = stock + $1, updated_at = now() WHERE id = $2`,
      [existing.cantidad, existing.idProducto]
    );

    if (existing.idLote) {
      await database(this.db, tx).query(
        `UPDATE lote SET stock = stock + $1, esta_activo = true WHERE id = $2`,
        [existing.cantidad, existing.idLote]
      );
    }

    const [reverso] = await database(this.db, tx).query(
      `INSERT INTO salida_producto (motivo, cantidad, estado, documento_origen, referencia_reversion, id_lote, id_producto, ci_usuario, id_sucursal)
       VALUES ($1, $2, 'REVERSA', $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        `Reversión de salida #${id}: ${existing.motivo}`,
        existing.cantidad,
        existing.documentoOrigen || `SALIDA-${id}`,
        id,
        existing.idLote || null,
        existing.idProducto,
        userCi || null,
        existing.idSucursal || null,
      ]
    );

    return (await this.findById(Number(reverso.id), tx))!;
  }

  private mapRow(row: any): ProductExitRecord {
    return {
      id: Number(row.id),
      motivo: row.motivo,
      cantidad: Number(row.cantidad),
      fecha: row.fecha,
      estado: row.estado || 'CONFIRMADA',
      documentoOrigen: row.documentoOrigen || null,
      referenciaReversion: row.referenciaReversion ? Number(row.referenciaReversion) : null,
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
