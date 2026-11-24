import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { StockAlertDispatcher } from '../../../../shared/domain/mailer';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateSaleCommand } from '../domain/commands';
import { CustomerRecord, SaleRecord } from '../domain/models';
import { SaleRepository } from '../domain/repository';

/**
 * CU11. Gestionar ventas (Actores: Empleado, Gerente de Sucursal, Cliente).
 */
@Injectable()
export class SaleService {
  constructor(
    private readonly repository: SaleRepository,
    private readonly transactions: AdministrativeTransaction,
    private readonly stockAlerts: StockAlertDispatcher,
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

  async validarStock(dto: CreateSaleCommand, tx?: TransactionContext): Promise<void> {
    await this.repository.validateSaleInput(dto, tx);
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

    const created = await this.transactions.mutation(req, 'ventas.crear', 'nota_venta', async tx => {
      await this.validarStock(dto, tx);
      return this.repository.create(dto, req.user.ci, tx);
    });
    this.stockAlerts.dispatchPendingAsync();
    return created;
  }

  async anular(id: number, req: AuthRequest): Promise<SaleRecord> {
    return this.transactions.mutation(req, 'ventas.deshabilitar', 'nota_venta', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.annul(id, req.user.ci, tx);
    });
  }

  // Alias de trazabilidad con diagramas UML (CU11)
  procesarVenta(dto: CreateSaleCommand, req: AuthRequest) { return this.crear(dto, req); }
  crearVenta(dto: CreateSaleCommand, req: AuthRequest) { return this.crear(dto, req); }
  listarVentas(query: ListQuery, branchId?: number) { return this.obtener(query, branchId); }
  anularVenta(id: number, req: AuthRequest) { return this.anular(id, req); }
}

export const ServicioNotaVenta = SaleService;
export const ServicioVenta = SaleService;
