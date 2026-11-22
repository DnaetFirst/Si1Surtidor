import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { ProductNotificationRecord } from './models';

export abstract class NotificationRepository {
  abstract list(query: ListQuery, ciUsuario?: string, tx?: TransactionContext): Promise<PageResult<ProductNotificationRecord>>;
  abstract markAsRead(id: number, ciUsuario: string, tx?: TransactionContext): Promise<void>;
  abstract resolve(id: number, tx?: TransactionContext): Promise<void>;
  abstract unreadCount(ciUsuario: string, tx?: TransactionContext): Promise<number>;
}
