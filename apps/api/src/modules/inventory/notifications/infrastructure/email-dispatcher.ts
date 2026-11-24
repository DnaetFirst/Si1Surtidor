import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppMailer, DispatchAlertsSummary, StockAlertDispatcher } from '../../../../shared/domain/mailer';
import { filterDeliverableEmails, renderStockAlertEmail } from '../domain/email-alert';

interface PendingAlertRow {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: Date | string;
  idProducto: number;
  productoNombre: string;
  stock: number | string;
  stockMinimo: number | string;
  idSucursal: number | null;
  sucursalNombre: string | null;
}

@Injectable()
export class PostgresStockAlertDispatcher
  extends StockAlertDispatcher
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PostgresStockAlertDispatcher.name);
  private retryTimer?: NodeJS.Timeout;
  private startupTimer?: NodeJS.Timeout;

  constructor(
    private readonly db: DataSource,
    private readonly mailer: AppMailer,
  ) {
    super();
  }

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.startupTimer = setTimeout(() => {
      void this.dispatchPending().catch(err =>
        this.logger.warn(`No se pudieron despachar alertas iniciales: ${err instanceof Error ? err.message : err}`),
      );
    }, 5000);
    this.startupTimer.unref();

    this.retryTimer = setInterval(() => {
      void this.dispatchPending().catch(err =>
        this.logger.warn(`Error en reintento periódico de alertas: ${err instanceof Error ? err.message : err}`),
      );
    }, 60000);
    this.retryTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.startupTimer) clearTimeout(this.startupTimer);
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  dispatchPendingAsync(): void {
    setImmediate(() => {
      void this.dispatchPending().catch(err =>
        this.logger.warn(`Fallo despachando alerta por correo: ${err instanceof Error ? err.message : err}`),
      );
    });
  }

  private async resolveRecipients(branchId: number | null): Promise<string[]> {
    const users = await this.db.query(
      `SELECT DISTINCT u.correo
       FROM usuario u
       JOIN rol r ON r.id = u.id_rol AND r.activo = true
       JOIN permiso_rol pr ON pr.id_rol = r.id
       JOIN permiso p ON p.id = pr.id_permiso AND p.activo = true
       WHERE u.activo = true
         AND p.codigo IN ('notificaciones.gestionar', 'notificaciones.ver')
         AND ($1::int IS NULL OR u.id_sucursal IS NULL OR u.id_sucursal = $1)`,
      [branchId],
    );

    const allowPlaceholders = (process.env.MAIL_MAILER || '').trim().toLowerCase() === 'log';
    return filterDeliverableEmails(
      users.map((u: { correo?: string }) => u.correo),
      allowPlaceholders,
    );
  }

  async dispatchPending(notificationId?: number): Promise<DispatchAlertsSummary> {
    if (!this.mailer.isConfigured()) {
      return { processed: 0, sent: 0, failed: 0, skipped: 0 };
    }

    const params: unknown[] = [];
    let filterSql = `
      WHERE n.resuelta = false
        AND n.correo_estado IN ('PENDIENTE', 'FALLIDO')
        AND n.correo_intentos < 5
    `;
    if (notificationId !== undefined) {
      params.push(notificationId);
      filterSql = `WHERE n.id = $1`;
    }

    const alerts: PendingAlertRow[] = await this.db.query(
      `SELECT n.id, n.titulo, n.descripcion, n.fecha,
              n.id_producto AS "idProducto",
              p.nombre AS "productoNombre",
              p.stock, p.stock_minimo AS "stockMinimo",
              p.id_sucursal AS "idSucursal",
              s.nombre AS "sucursalNombre"
       FROM notificacion_producto n
       JOIN producto p ON p.id = n.id_producto
       LEFT JOIN sucursal s ON s.id = p.id_sucursal
       ${filterSql}
       ORDER BY n.id ASC
       LIMIT 15`,
      params,
    );

    const summary: DispatchAlertsSummary = { processed: 0, sent: 0, failed: 0, skipped: 0 };
    const origin = (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

    for (const alert of alerts) {
      const claimQuery =
        notificationId !== undefined
          ? `UPDATE notificacion_producto
             SET correo_intentos = correo_intentos + 1
             WHERE id = $1
             RETURNING id`
          : `UPDATE notificacion_producto
             SET correo_intentos = correo_intentos + 1
             WHERE id = $1
               AND correo_estado IN ('PENDIENTE', 'FALLIDO')
               AND correo_intentos < 5
             RETURNING id`;

      const claimed = await this.db.query(claimQuery, [alert.id]);
      if (!claimed.length) continue;

      summary.processed++;

      try {
        const recipients = await this.resolveRecipients(alert.idSucursal);
        if (!recipients.length) {
          await this.db.query(
            `UPDATE notificacion_producto
             SET correo_estado = 'SIN_DESTINATARIOS',
                 correo_ultimo_error = 'No hay correos válidos configurados para notificar esta alerta.'
             WHERE id = $1`,
            [alert.id],
          );
          summary.skipped++;
          continue;
        }

        const rendered = renderStockAlertEmail({
          id: Number(alert.id),
          titulo: alert.titulo,
          descripcion: alert.descripcion || '',
          fecha: alert.fecha,
          productoNombre: alert.productoNombre,
          stockActual: Number(alert.stock || 0),
          stockMinimo: Number(alert.stockMinimo || 0),
          sucursalNombre: alert.sucursalNombre,
          portalUrl: `${origin}/productos`,
        });

        const deliveredTo: string[] = [];
        const sendErrors: string[] = [];

        for (const recipient of recipients) {
          try {
            await this.mailer.send({
              to: [recipient],
              subject: rendered.subject,
              text: rendered.text,
              html: rendered.html,
            });
            deliveredTo.push(recipient);
          } catch (recipientErr) {
            const detail = recipientErr instanceof Error ? recipientErr.message : String(recipientErr);
            sendErrors.push(`${recipient}: ${detail}`);
            this.logger.warn(`No se pudo enviar alerta #${alert.id} a ${recipient}: ${detail}`);
          }
        }

        if (deliveredTo.length > 0) {
          await this.db.query(
            `UPDATE notificacion_producto
             SET correo_estado = 'ENVIADO',
                 correo_enviado_at = now(),
                 correo_destinatarios = $2,
                 correo_ultimo_error = $3
             WHERE id = $1`,
            [alert.id, deliveredTo.join(', '), sendErrors.join(' | ').slice(0, 250)],
          );
          summary.sent++;
        } else {
          await this.db.query(
            `UPDATE notificacion_producto
             SET correo_estado = 'FALLIDO',
                 correo_ultimo_error = $2
             WHERE id = $1`,
            [alert.id, sendErrors.join(' | ').slice(0, 250) || 'Sin entregas válidas'],
          );
          summary.failed++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await this.db.query(
          `UPDATE notificacion_producto
           SET correo_estado = 'FALLIDO',
               correo_ultimo_error = $2
           WHERE id = $1`,
          [alert.id, msg.slice(0, 250)],
        );
        summary.failed++;
        this.logger.warn(`Error enviando alerta #${alert.id}: ${msg}`);
      }
    }

    return summary;
  }
}
