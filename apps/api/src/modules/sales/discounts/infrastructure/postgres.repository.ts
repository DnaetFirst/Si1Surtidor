import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreateDiscountCommand, UpdateDiscountCommand } from '../domain/commands';
import { DiscountRecord } from '../domain/models';
import { DiscountRepository } from '../domain/repository';

const discountFields = `
  d.id, d.nombre, d.descripcion, d.tipo, d.valor, d.monto, d.porcentaje,
  d.activo, d.esta_activo AS "estaActivo",
  d.fecha_inicio AS "fechaInicio", d.fecha_fin AS "fechaFin",
  d.id_sucursal AS "idSucursal",
  s.nombre AS "sucursalNombre", d.created_at AS "createdAt", d.updated_at AS "updatedAt"
`;

@Injectable()
export class PostgresDiscountRepository extends DiscountRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<DiscountRecord>> {
    const { params, where } = filters(query);
    if (branchId) {
      params.push(branchId);
      where.push(`(d.id_sucursal = $${params.length} OR d.id_sucursal IS NULL)`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(d.nombre ILIKE $${params.length} OR d.descripcion ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      discountFields,
      'descuento d LEFT JOIN sucursal s ON s.id = d.id_sucursal',
      where,
      params,
      query,
      'd.id DESC'
    );
    return {
      items: result.items.map(this.mapRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async findById(id: number, tx?: TransactionContext): Promise<DiscountRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT ${discountFields} FROM descuento d LEFT JOIN sucursal s ON s.id = d.id_sucursal WHERE d.id = $1`,
      [id]
    );
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findActive(branchId?: number, tx?: TransactionContext): Promise<DiscountRecord[]> {
    let sql = `SELECT ${discountFields} FROM descuento d LEFT JOIN sucursal s ON s.id = d.id_sucursal
      WHERE d.activo = true
        AND (d.fecha_inicio IS NULL OR d.fecha_inicio <= CURRENT_DATE)
        AND (d.fecha_fin IS NULL OR d.fecha_fin >= CURRENT_DATE)`;
    const params: any[] = [];
    if (branchId) {
      params.push(branchId);
      sql += ` AND (d.id_sucursal = $${params.length} OR d.id_sucursal IS NULL)`;
    }
    sql += ` ORDER BY d.nombre ASC`;
    const rows = await database(this.db, tx).query(sql, params);
    return rows.map(this.mapRow);
  }

  async create(cmd: CreateDiscountCommand, tx?: TransactionContext): Promise<DiscountRecord> {
    const valor = Number(cmd.valor) || 0;
    const isPercent = cmd.tipo === 'PORCENTAJE';
    const monto = isPercent ? 0 : valor;
    const porcentaje = isPercent ? valor : 0;
    const activo = cmd.activo ?? true;

    const rows = await database(this.db, tx).query(
      `INSERT INTO descuento (nombre, descripcion, tipo, valor, monto, porcentaje, activo, esta_activo, fecha_inicio, fecha_fin, id_sucursal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10)
       RETURNING id`,
      [cmd.nombre.trim(), cmd.descripcion || '', cmd.tipo, valor, monto, porcentaje, activo, cmd.fechaInicio || null, cmd.fechaFin || null, cmd.idSucursal || null]
    );
    const created = await this.findById(rows[0].id, tx);
    return created!;
  }

  async update(id: number, cmd: UpdateDiscountCommand, tx?: TransactionContext): Promise<DiscountRecord> {
    const existing = await this.findById(id, tx);
    if (!existing) throw new Error('Descuento no encontrado.');

    const tipo = cmd.tipo ?? existing.tipo;
    const valor = cmd.valor !== undefined ? Number(cmd.valor) : existing.valor;
    const isPercent = tipo === 'PORCENTAJE';
    const monto = isPercent ? 0 : valor;
    const porcentaje = isPercent ? valor : 0;
    const activo = cmd.activo !== undefined ? cmd.activo : existing.activo;
    const fechaInicio = cmd.fechaInicio !== undefined ? cmd.fechaInicio : existing.fechaInicio ?? null;
    const fechaFin = cmd.fechaFin !== undefined ? cmd.fechaFin : existing.fechaFin ?? null;

    await database(this.db, tx).query(
      `UPDATE descuento
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           tipo = $3,
           valor = $4,
           monto = $5,
           porcentaje = $6,
           activo = $7,
           esta_activo = $7,
           fecha_inicio = $8,
           fecha_fin = $9,
           id_sucursal = $10,
           updated_at = now()
       WHERE id = $11`,
      [
        cmd.nombre ? cmd.nombre.trim() : null,
        cmd.descripcion !== undefined ? cmd.descripcion : null,
        tipo,
        valor,
        monto,
        porcentaje,
        activo,
        fechaInicio,
        fechaFin,
        cmd.idSucursal !== undefined ? cmd.idSucursal : existing.idSucursal,
        id,
      ]
    );
    const updated = await this.findById(id, tx);
    return updated!;
  }

  async toggleActive(id: number, tx?: TransactionContext): Promise<DiscountRecord> {
    await database(this.db, tx).query(
      `UPDATE descuento SET activo = NOT activo, esta_activo = NOT esta_activo, updated_at = now() WHERE id = $1`,
      [id]
    );
    const updated = await this.findById(id, tx);
    return updated!;
  }

  async remove(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(`DELETE FROM descuento WHERE id = $1`, [id]);
  }

  async isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM sucursal WHERE id = $1 AND activo = true`,
      [branchId]
    );
    return !!row;
  }

  private mapRow(row: any): DiscountRecord {
    const fmt = (d: any) => !d ? null : (typeof d === 'string' ? d.split('T')[0] : d.toISOString?.()?.split('T')[0] ?? null);
    return {
      id: Number(row.id),
      nombre: row.nombre,
      descripcion: row.descripcion || '',
      tipo: row.tipo,
      valor: Number(row.valor || 0),
      monto: Number(row.monto || 0),
      porcentaje: Number(row.porcentaje || 0),
      activo: Boolean(row.activo),
      estaActivo: Boolean(row.estaActivo ?? row.activo),
      fechaInicio: fmt(row.fechaInicio),
      fechaFin: fmt(row.fechaFin),
      idSucursal: row.idSucursal ? Number(row.idSucursal) : null,
      sucursalNombre: row.sucursalNombre || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
