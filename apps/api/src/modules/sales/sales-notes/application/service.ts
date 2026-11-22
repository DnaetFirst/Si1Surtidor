import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateSaleCommand } from '../domain/commands';
import { CustomerRecord, SaleRecord } from '../domain/models';
import { SaleRepository } from '../domain/repository';

@Injectable()
export class SaleService {
  constructor(
    private readonly repository: SaleRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, branchId?: number): Promise<PageResult<SaleRecord>> {
    return this.repository.list(query, branchId);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<SaleRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Nota de venta no encontrada.');
    return item;
  }

  async obtenerClientes(query: ListQuery): Promise<PageResult<CustomerRecord>> {
    return this.repository.listCustomers(query);
  }

  async crear(dto: CreateSaleCommand, req: AuthRequest): Promise<SaleRecord> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto o combustible.');
    }

    if (dto.codigo) {
      const existing = await this.repository.findByCode(dto.codigo);
      if (existing) {
        throw new ConflictException(`Ya existe una nota de venta con el código ${dto.codigo}`);
      }
    }

    return this.transactions.mutation(req, 'ventas.crear', 'nota_venta', async tx => {
      return this.repository.create(dto, req.user.ci, tx);
    });
  }
}

export const ServicioNotaVenta = SaleService;
