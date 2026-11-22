import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreatePurchaseOrderCommand, UpdatePurchaseOrderStatusCommand } from '../domain/commands';
import { PurchaseOrderRecord } from '../domain/models';
import { PurchaseOrderRepository } from '../domain/repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, branchId?: number): Promise<PageResult<PurchaseOrderRecord>> {
    return this.repository.list(query, branchId);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<PurchaseOrderRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Orden de compra no encontrada.');
    return item;
  }

  async crear(dto: CreatePurchaseOrderCommand, req: AuthRequest): Promise<PurchaseOrderRecord> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('La orden de compra debe contener al menos un producto.');
    }

    if (dto.codigo) {
      const existing = await this.repository.findByCode(dto.codigo);
      if (existing) {
        throw new ConflictException(`Ya existe una orden de compra con el código ${dto.codigo}`);
      }
    }

    return this.transactions.mutation(req, 'ordenes.crear', 'orden_compra', async tx => {
      return this.repository.create(dto, req.user.ci, tx);
    });
  }

  async cambiarEstado(id: number, dto: UpdatePurchaseOrderStatusCommand, req: AuthRequest): Promise<PurchaseOrderRecord> {
    const existing = await this.obtenerPorId(id);
    if (existing.estado === 'ANULADA') {
      throw new BadRequestException('No se puede cambiar el estado de una orden anulada.');
    }
    if (existing.estado === 'RECIBIDA' && dto.estado === 'ANULADA') {
      throw new BadRequestException('No se puede anular una orden de compra que ya ha sido recibida.');
    }

    const action = 'ordenes.editar';
    return this.transactions.mutation(req, action, 'orden_compra', async tx => {
      return this.repository.updateStatus(id, dto, tx);
    });
  }
}

export const ServicioOrdenCompra = PurchaseOrderService;
