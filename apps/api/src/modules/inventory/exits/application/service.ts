import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateProductExitCommand } from '../domain/commands';
import { ProductExitRecord } from '../domain/models';
import { ProductExitRepository } from '../domain/repository';

@Injectable()
export class ProductExitService {
  constructor(
    private readonly repository: ProductExitRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, branchId?: number): Promise<PageResult<ProductExitRecord>> {
    return this.repository.list(query, branchId);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<ProductExitRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Salida de producto no encontrada.');
    return item;
  }

  async registrarSalida(dto: CreateProductExitCommand, req: AuthRequest): Promise<ProductExitRecord> {
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0.');
    }

    return this.transactions.mutation(req, 'salidas.crear', 'salida_producto', async tx => {
      return this.repository.create(dto, tx, req.user?.ci);
    });
  }
}

export const ServicioSalidaProducto = ProductExitService;
