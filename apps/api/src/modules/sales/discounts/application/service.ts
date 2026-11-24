import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateDiscountCommand, UpdateDiscountCommand } from '../domain/commands';
import { DiscountRecord } from '../domain/models';
import { DiscountRepository } from '../domain/repository';

/**
 * CU12. Gestionar descuentos (Actores: Administrador TI y Gerente de Sucursal).
 * Valida porcentajes (0, 100], montos positivos, vigencia de fechas y sucursal activa.
 */
@Injectable()
export class DiscountService {
  constructor(
    private readonly repository: DiscountRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  validarVigenciaFechas(fechaInicio?: string | null, fechaFin?: string | null): void {
    if (fechaInicio && fechaFin && Date.parse(fechaInicio) > Date.parse(fechaFin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin.');
    }
  }

  private validarParametros(tipo: 'PORCENTAJE' | 'MONTO_FIJO', valor: number): void {
    if (tipo === 'PORCENTAJE' && (valor <= 0 || valor > 100)) {
      throw new BadRequestException('El porcentaje de descuento debe ser mayor a 0 y no superior a 100.');
    }
    if (tipo === 'MONTO_FIJO' && valor <= 0) {
      throw new BadRequestException('El monto fijo de descuento debe ser mayor a 0.');
    }
  }

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
    this.validarParametros(dto.tipo, Number(dto.valor));
    this.validarVigenciaFechas(dto.fechaInicio, dto.fechaFin);

    return this.transactions.mutation(req, 'descuentos.crear', 'descuento', async tx => {
      if (dto.idSucursal && !(await this.repository.isBranchActive(dto.idSucursal, tx))) {
        throw new ConflictException('La sucursal seleccionada no existe o está inactiva.');
      }
      return this.repository.create(dto, tx);
    });
  }

  async modificar(id: number, dto: UpdateDiscountCommand, req: AuthRequest): Promise<DiscountRecord> {
    const existing = await this.obtenerPorId(id);
    const tipo = dto.tipo ?? existing.tipo;
    const valor = dto.valor !== undefined ? Number(dto.valor) : existing.valor;
    const fechaInicio = dto.fechaInicio !== undefined ? dto.fechaInicio : existing.fechaInicio;
    const fechaFin = dto.fechaFin !== undefined ? dto.fechaFin : existing.fechaFin;
    this.validarParametros(tipo, valor);
    this.validarVigenciaFechas(fechaInicio, fechaFin);

    return this.transactions.mutation(req, 'descuentos.editar', 'descuento', async tx => {
      if (dto.idSucursal && !(await this.repository.isBranchActive(dto.idSucursal, tx))) {
        throw new ConflictException('La sucursal seleccionada no existe o está inactiva.');
      }
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
    return this.transactions.mutation(req, 'descuentos.deshabilitar', 'descuento', async tx => {
      return this.repository.remove(id, tx);
    });
  }

  // Alias de trazabilidad con diagramas CU12
  saveDiscount(dto: CreateDiscountCommand, req: AuthRequest) { return this.crear(dto, req); }
  AgregarDescuento(dto: CreateDiscountCommand, req: AuthRequest) { return this.crear(dto, req); }
  ModificarDescuento(id: number, dto: UpdateDiscountCommand, req: AuthRequest) { return this.modificar(id, dto, req); }
  EliminarDescuento(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  ObtenerDescuento(query: ListQuery, branchId?: number) { return this.obtener(query, branchId); }
}

export const ServicioDescuento = DiscountService;
