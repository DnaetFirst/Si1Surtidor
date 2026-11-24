import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreatePurchaseReceiptCommand, UpdatePurchaseReceiptCommand } from '../domain/commands';
import { BatchRecord, PurchaseReceiptRecord } from '../domain/models';
import { PurchaseReceiptRepository } from '../domain/repository';

/**
 * CU10. Gestionar compras (Actores: Administrador TI, Gerente de Sucursal, Proveedor).
 */
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

  async verificarOrdenCompraPendiente(idOrden: number, tx?: TransactionContext): Promise<void> {
    const estado = await this.repository.getOrderStatus(idOrden, tx);
    if (!estado) {
      throw new NotFoundException('La orden de compra vinculada no existe.');
    }
    if (estado !== 'PENDIENTE' && estado !== 'APROBADA') {
      throw new ConflictException(`La orden de compra no puede recibirse porque su estado actual es ${estado}.`);
    }
  }

  async crear(dto: CreatePurchaseReceiptCommand, req: AuthRequest): Promise<PurchaseReceiptRecord> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('La recepción de compra debe tener al menos un producto.');
    }

    for (const d of dto.detalles) {
      if (Number(d.cantidad) <= 0 || Number(d.precio) < 0) {
        throw new BadRequestException('Las cantidades deben ser mayores a 0 y los precios no pueden ser negativos.');
      }
    }

    if (dto.codigo) {
      const existing = await this.repository.findByCode(dto.codigo);
      if (existing) {
        throw new ConflictException(`Ya existe una nota de compra con el código ${dto.codigo}`);
      }
    }

    return this.transactions.mutation(req, 'compras.crear', 'nota_compra', async tx => {
      if (dto.idOrden) {
        await this.verificarOrdenCompraPendiente(dto.idOrden, tx);
      }
      if (dto.idSucursal && !(await this.repository.isBranchActive(dto.idSucursal, tx))) {
        throw new ConflictException('La sucursal especificada no existe o está inactiva.');
      }
      if (dto.idProveedor && !(await this.repository.isProviderActive(dto.idProveedor, tx))) {
        throw new ConflictException('El proveedor especificado no existe o está inactivo.');
      }
      for (const d of dto.detalles) {
        if (!(await this.repository.isProductActive(d.idProducto, tx))) {
          throw new ConflictException(`El producto #${d.idProducto} no existe o está inactivo.`);
        }
      }
      return this.repository.create(dto, req.user.ci, tx);
    });
  }

  async editar(id: number, dto: UpdatePurchaseReceiptCommand, req: AuthRequest): Promise<PurchaseReceiptRecord> {
    return this.transactions.mutation(req, 'compras.editar', 'nota_compra', async tx => {
      const existing = await this.obtenerPorId(id, tx);
      if (existing.estado === 'ANULADA') {
        throw new ConflictException('No se puede editar una nota de compra anulada.');
      }
      return this.repository.update(id, dto, tx);
    });
  }

  async anular(id: number, req: AuthRequest): Promise<PurchaseReceiptRecord> {
    return this.transactions.mutation(req, 'compras.deshabilitar', 'nota_compra', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.annul(id, tx);
    });
  }

  // Alias de trazabilidad con diagramas UML (CU10)
  createPurchaseNote(dto: CreatePurchaseReceiptCommand, req: AuthRequest) { return this.crear(dto, req); }
  CrearCompra(dto: CreatePurchaseReceiptCommand, req: AuthRequest) { return this.crear(dto, req); }
  EditarCompra(id: number, dto: UpdatePurchaseReceiptCommand, req: AuthRequest) { return this.editar(id, dto, req); }
}

export const ServicioNotaCompra = PurchaseReceiptService;
export const ServicioCompra = PurchaseReceiptService;
