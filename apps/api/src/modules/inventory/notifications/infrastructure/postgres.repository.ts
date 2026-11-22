import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { ProductNotificationRecord } from '../domain/models';
import { NotificationRepository } from '../domain/repository';

const notifFields = `
  n.id, n.titulo, n.descripcion, n.fecha, n.resuelta,
  n.id_producto AS "idProducto", p.nombre AS "productoNombre",
  p.stock AS "productoStock", p.stock_minimo AS "productoStockMinimo",
  COALESCE(un.visto, false) AS "visto"
`;

@Injectable()
export class PostgresNotificationRepository extends NotificationRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, ciUsuario?: string, tx?: TransactionContext): Promise<PageResult<ProductNotificationRecord>> {
    const { params, where } = filters(query);
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(n.titulo ILIKE $${params.length} OR n.descripcion ILIKE $${params.length} OR p.nombre ILIKE $${params.length})`);
    }

    const joinClause = `
      notificacion_producto n
      JOIN producto p ON p.id = n.id_producto
      LEFT JOIN usuario_notificacion un ON un.id_notificacion = n.id AND un.ci_usuario = '${ciUsuario?.replace(/'/g, "''") || ''}'
    `;

    const result = await page(
      database(this.db, tx),
      notifFields,
      joinClause,
      where,
      params,
      query,
      'n.id DESC'
    );

    return {
      items: result.items.map(this.mapRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async markAsRead(id: number, ciUsuario: string, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(
      `INSERT INTO usuario_notificacion (visto, ci_usuario, id_notificacion)
       VALUES (true, $1, $2)
       ON CONFLICT DO NOTHING`,
      [ciUsuario, id]
    );
  }

  async resolve(id: number, tx?: TransactionContext): Promise<void> {
    await database(this.db, tx).query(
      `UPDATE notificacion_producto SET resuelta = true WHERE id = $1`,
      [id]
    );
  }

  async unreadCount(ciUsuario: string, tx?: TransactionContext): Promise<number> {
    const rows = await database(this.db, tx).query(
      `SELECT count(*)::integer AS count
       FROM notificacion_producto n
       WHERE n.resuelta = false
         AND NOT EXISTS (
           SELECT 1 FROM usuario_notificacion un
           WHERE un.id_notificacion = n.id AND un.ci_usuario = $1 AND un.visto = true
         )`,
      [ciUsuario]
    );
    return Number(rows[0]?.count || 0);
  }

  private mapRow(row: any): ProductNotificationRecord {
    return {
      id: Number(row.id),
      titulo: row.titulo,
      descripcion: row.descripcion || '',
      fecha: row.fecha,
      resuelta: Boolean(row.resuelta),
      idProducto: Number(row.idProducto),
      productoNombre: row.productoNombre,
      productoStock: Number(row.productoStock || 0),
      productoStockMinimo: Number(row.productoStockMinimo || 0),
      visto: Boolean(row.visto),
    };
  }
}
