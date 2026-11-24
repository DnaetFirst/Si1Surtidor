import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { StockAlertDispatcher } from '../../../../shared/domain/mailer';
import { BadRequestException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateProductExitCommand } from '../domain/commands';
import { ProductExitRecord } from '../domain/models';
import { ProductExitRepository } from '../domain/repository';

/**
 * CU19. Gestionar salidas de productos (Actores: Administrador TI y Gerente de Sucursal).
 * Controla disponibilidad por producto/lote y reversión trazable de existencias.
 */
@Injectable()
export class ProductExitService {
  constructor(
    private readonly repository: ProductExitRepository,
    private readonly transactions: AdministrativeTransaction,
    private readonly stockAlerts: StockAlertDispatcher,
  ) {}

  async obtener(query: ListQuery, branchId?: number): Promise<PageResult<ProductExitRecord>> {
    return this.repository.list(query, branchId);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<ProductExitRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Salida de producto no encontrada.');
    return item;
  }

  async validarDisponibilidad(dto: CreateProductExitCommand, tx?: TransactionContext): Promise<void> {
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0.');
    }
    await this.repository.validateAvailability(dto, tx);
  }

  async registrarSalida(dto: CreateProductExitCommand, req: AuthRequest): Promise<ProductExitRecord> {
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0.');
    }

    const created = await this.transactions.mutation(req, 'salidas.crear', 'salida_producto', async tx => {
      await this.validarDisponibilidad(dto, tx);
      return this.repository.create(dto, tx, req.user?.ci);
    });
    this.stockAlerts.dispatchPendingAsync();
    return created;
  }

  async revertirSalida(id: number, req: AuthRequest): Promise<ProductExitRecord> {
    return this.transactions.mutation(req, 'salidas.deshabilitar', 'salida_producto', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.revert(id, tx, req.user?.ci);
    });
  }

  // Alias de trazabilidad con diagramas UML (CU19)
  crear(dto: CreateProductExitCommand, req: AuthRequest) { return this.registrarSalida(dto, req); }
  validarPermisos() { return true; }
}

export const ServicioSalidaProducto = ProductExitService;
export const ControlSalida = ProductExitService;
