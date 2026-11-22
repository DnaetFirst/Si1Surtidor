import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { ProductNotificationRecord } from '../domain/models';
import { NotificationRepository } from '../domain/repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, req: AuthRequest): Promise<PageResult<ProductNotificationRecord>> {
    return this.repository.list(query, req.user.ci);
  }

  async contarNoLeidas(req: AuthRequest): Promise<{ noLeidas: number }> {
    const count = await this.repository.unreadCount(req.user.ci);
    return { noLeidas: count };
  }

  async marcarLeida(id: number, req: AuthRequest): Promise<void> {
    await this.repository.markAsRead(id, req.user.ci);
  }

  async resolver(id: number, req: AuthRequest): Promise<void> {
    return this.transactions.mutation(req, 'notificaciones.gestionar', 'notificacion_producto', async tx => {
      await this.repository.resolve(id, tx);
    });
  }
}

export const ServicioNotificacion = NotificationService;
