import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateDiscountCommand, UpdateDiscountCommand } from '../domain/commands';
import { DiscountRecord } from '../domain/models';
import { DiscountRepository } from '../domain/repository';

@Injectable()
export class DiscountService {
  constructor(
    private readonly repository: DiscountRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, branchId?: number): Promise<PageResult<DiscountRecord>> {
    return this.repository.list(query, branchId);
  }

  async obtenerActivos(branchId?: number): Promise<DiscountRecord[]> {
    return this.repository.findActive(branchId);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<DiscountRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Descuento no encontrado.');
    return item;
  }

  async crear(dto: CreateDiscountCommand, req: AuthRequest): Promise<DiscountRecord> {
    return this.transactions.mutation(req, 'descuentos.crear', 'descuento', async tx => {
      return this.repository.create(dto, tx);
    });
  }

  async modificar(id: number, dto: UpdateDiscountCommand, req: AuthRequest): Promise<DiscountRecord> {
    await this.obtenerPorId(id);
    return this.transactions.mutation(req, 'descuentos.editar', 'descuento', async tx => {
      return this.repository.update(id, dto, tx);
    });
  }

  async alternarEstado(id: number, req: AuthRequest): Promise<DiscountRecord> {
    await this.obtenerPorId(id);
    return this.transactions.mutation(req, 'descuentos.editar', 'descuento', async tx => {
      return this.repository.toggleActive(id, tx);
    });
  }

  async eliminar(id: number, req: AuthRequest): Promise<void> {
    await this.obtenerPorId(id);
    return this.transactions.mutation(req, 'descuentos.eliminar', 'descuento', async tx => {
      return this.repository.remove(id, tx);
    });
  }
}

export const ServicioDescuento = DiscountService;
