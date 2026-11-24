import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreatePurchaseOrderCommand, CreatePurchaseOrderItemCommand, UpdatePurchaseOrderCommand, UpdatePurchaseOrderStatusCommand } from '../domain/commands';
import { PurchaseOrderRecord } from '../domain/models';
import { PurchaseOrderRepository } from '../domain/repository';

/**
 * CU9. Gestionar órdenes de compra (Actores: Administrador TI, Gerente de Sucursal, Proveedor).
 */
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

  async validarProveedorActivo(idProveedor: number, tx?: TransactionContext): Promise<void> {
    if (!(await this.repository.isProviderActive(idProveedor, tx))) {
      throw new ConflictException('El proveedor seleccionado no existe o está inactivo.');
    }
  }

  private async validarReferenciasOrden(
    idSucursal: number | undefined,
    idProveedor: number | undefined,
    detalles: CreatePurchaseOrderItemCommand[] | undefined,
    tx: TransactionContext
  ): Promise<void> {
    if (idSucursal !== undefined && !(await this.repository.isBranchActive(idSucursal, tx))) {
      throw new ConflictException('La sucursal seleccionada no existe o está inactiva.');
    }
    if (idProveedor !== undefined) {
      await this.validarProveedorActivo(idProveedor, tx);
    }
    if (detalles) {
      for (const item of detalles) {
        if (Number(item.cantidad) <= 0) {
          throw new BadRequestException('Las cantidades solicitadas deben ser mayores a cero.');
        }
        if (!(await this.repository.isProductActive(item.idProducto, tx))) {
          throw new ConflictException(`El producto #${item.idProducto} no existe o está inactivo.`);
        }
      }
    }
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
      await this.validarReferenciasOrden(dto.idSucursal, dto.idProveedor, dto.detalles, tx);
      return this.repository.create(dto, req.user.ci, tx);
    });
  }

  async modificar(id: number, dto: UpdatePurchaseOrderCommand, req: AuthRequest): Promise<PurchaseOrderRecord> {
    return this.transactions.mutation(req, 'ordenes.editar', 'orden_compra', async tx => {
      const existing = await this.obtenerPorId(id, tx);
      if (existing.estado !== 'PENDIENTE') {
        throw new ConflictException('Solo se pueden modificar órdenes de compra en estado PENDIENTE.');
      }
      if (dto.detalles && dto.detalles.length === 0) {
        throw new BadRequestException('La orden de compra debe contener al menos un producto.');
      }
      await this.validarReferenciasOrden(dto.idSucursal, dto.idProveedor, dto.detalles, tx);
      return this.repository.update(id, dto, tx);
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

    return this.transactions.mutation(req, 'ordenes.editar', 'orden_compra', async tx => {
      return this.repository.updateStatus(id, dto, tx);
    });
  }

  async eliminar(id: number, req: AuthRequest): Promise<PurchaseOrderRecord> {
    return this.transactions.mutation(req, 'ordenes.deshabilitar', 'orden_compra', async tx => {
      const existing = await this.obtenerPorId(id, tx);
      if (existing.estado === 'RECIBIDA' || (await this.repository.hasReceipts(id, tx))) {
        throw new ConflictException('Una orden de compra atendida conserva su historial y no puede cancelarse.');
      }
      if (existing.estado === 'ANULADA') {
        throw new ConflictException('La orden de compra ya fue anulada.');
      }
      return this.repository.updateStatus(id, { estado: 'ANULADA', motivo: existing.motivo }, tx);
    });
  }

  // Alias de trazabilidad con diagramas UML (CU9)
  createPurchaseOrder(dto: CreatePurchaseOrderCommand, req: AuthRequest) { return this.crear(dto, req); }
  AgregarOrdenDeCompra(dto: CreatePurchaseOrderCommand, req: AuthRequest) { return this.crear(dto, req); }
  ModificarOrdenDeCompra(id: number, dto: UpdatePurchaseOrderCommand, req: AuthRequest) { return this.modificar(id, dto, req); }
  EliminarOrdenDeCompra(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}

export const ServicioOrdenCompra = PurchaseOrderService;
