import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreatePurchaseReceiptCommand } from '../domain/commands';
import { BatchRecord, PurchaseReceiptRecord } from '../domain/models';
import { PurchaseReceiptRepository } from '../domain/repository';

@Injectable()
export class PurchaseReceiptService {
  constructor(
    private readonly repository: PurchaseReceiptRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, branchId?: number): Promise<PageResult<PurchaseReceiptRecord>> {
    return this.repository.list(query, branchId);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<PurchaseReceiptRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Nota de compra no encontrada.');
    return item;
  }

  async obtenerLotes(query: ListQuery, productId?: number): Promise<PageResult<BatchRecord>> {
    return this.repository.listBatches(query, productId);
  }

  async crear(dto: CreatePurchaseReceiptCommand, req: AuthRequest): Promise<PurchaseReceiptRecord> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('La recepción de compra debe tener al menos un producto.');
    }

    if (dto.codigo) {
      const existing = await this.repository.findByCode(dto.codigo);
      if (existing) {
        throw new ConflictException(`Ya existe una nota de compra con el código ${dto.codigo}`);
      }
    }

    return this.transactions.mutation(req, 'compras.crear', 'nota_compra', async tx => {
      return this.repository.create(dto, req.user.ci, tx);
    });
  }
}

export const ServicioNotaCompra = PurchaseReceiptService;
