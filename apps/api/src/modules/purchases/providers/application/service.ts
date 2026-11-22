import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateProviderCommand, LinkProductCommand, UpdateProviderCommand } from '../domain/commands';
import { ProviderProductRecord, ProviderRecord } from '../domain/models';
import { ProviderRepository } from '../domain/repository';

@Injectable()
export class ProviderService {
  constructor(
    private readonly repository: ProviderRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery): Promise<PageResult<ProviderRecord>> {
    return this.repository.list(query);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<ProviderRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Proveedor no encontrado.');
    return item;
  }

  async crear(dto: CreateProviderCommand, req: AuthRequest): Promise<ProviderRecord> {
    return this.transactions.mutation(req, 'proveedores.crear', 'proveedor', async tx => {
      if (await this.repository.duplicate(dto.nit, null, tx)) {
        throw new ConflictException(`Ya existe un proveedor registrado con el NIT "${dto.nit}".`);
      }
      return this.repository.create(dto, tx);
    });
  }

  async modificar(id: number, dto: UpdateProviderCommand, req: AuthRequest): Promise<ProviderRecord> {
    return this.transactions.mutation(req, 'proveedores.editar', 'proveedor', async tx => {
      await this.obtenerPorId(id, tx);
      if (dto.nit && (await this.repository.duplicate(dto.nit, id, tx))) {
        throw new ConflictException(`Ya existe otro proveedor con el NIT "${dto.nit}".`);
      }
      return this.repository.update(id, dto, tx);
    });
  }

  async deshabilitar(id: number, req: AuthRequest): Promise<ProviderRecord> {
    return this.transactions.mutation(req, 'proveedores.deshabilitar', 'proveedor', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.disable(id, tx);
    });
  }

  async cambiarEstado(id: number, req: AuthRequest): Promise<ProviderRecord> {
    return this.transactions.mutation(req, 'proveedores.editar', 'proveedor', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.toggleStatus(id, tx);
    });
  }

  async vincularProducto(id: number, dto: LinkProductCommand, req: AuthRequest): Promise<ProviderProductRecord> {
    return this.transactions.mutation(req, 'proveedores.editar', 'proveedor_producto', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.linkProduct(id, dto, tx);
    });
  }

  async desvincularProducto(id: number, productId: number, req: AuthRequest): Promise<{ success: boolean }> {
    return this.transactions.mutation(req, 'proveedores.editar', 'proveedor_producto', async tx => {
      await this.obtenerPorId(id, tx);
      await this.repository.unlinkProduct(id, productId, tx);
      return { success: true };
    });
  }

  // Alias para retrocompatibilidad
  list(query: ListQuery) { return this.obtener(query); }
  get(id: number, tx?: TransactionContext) { return this.obtenerPorId(id, tx); }
  create(dto: CreateProviderCommand, req: AuthRequest) { return this.crear(dto, req); }
  update(id: number, dto: UpdateProviderCommand, req: AuthRequest) { return this.modificar(id, dto, req); }
  disable(id: number, req: AuthRequest) { return this.deshabilitar(id, req); }
}

export { ProviderService as ServicioProveedor };
