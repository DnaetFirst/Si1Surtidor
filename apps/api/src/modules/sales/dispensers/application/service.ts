import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { CreateDispenserCommand, CreateHoseCommand, UpdateDispenserCommand, UpdateHoseCommand } from '../domain/commands';
import { DispenserRecord, HoseRecord } from '../domain/models';
import { DispenserRepository } from '../domain/repository';

/**
 * CU7. Gestionar dispensadores (Actores: Administrador TI y Gerente de Sucursal).
 * Controla alta, modificación, desactivación y configuración de mangueras por sucursal activa.
 */
@Injectable()
export class DispenserService {
  constructor(
    private readonly repository: DispenserRepository,
    private readonly transactions: AdministrativeTransaction,
  ) {}

  async obtener(query: ListQuery, req?: AuthRequest): Promise<PageResult<DispenserRecord>> {
    return this.repository.list(query);
  }

  async obtenerPorId(id: number, tx?: TransactionContext): Promise<DispenserRecord> {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Dispensador no encontrado.');
    return item;
  }

  async validarSucursalActiva(idSucursal: number, tx?: TransactionContext): Promise<void> {
    if (!(await this.repository.isBranchActive(idSucursal, tx))) {
      throw new ConflictException('La sucursal seleccionada no existe o está inactiva.');
    }
  }

  async validarCombustibleManguera(idCombustible: number, tx?: TransactionContext): Promise<void> {
    if (!(await this.repository.isFuelActive(idCombustible, tx))) {
      throw new ConflictException('El combustible asignado a la manguera no existe o está inactivo.');
    }
  }

  async crear(dto: CreateDispenserCommand, req: AuthRequest): Promise<DispenserRecord> {
    return this.transactions.mutation(req, 'dispensadores.crear', 'dispensador', async tx => {
      await this.validarSucursalActiva(dto.idSucursal, tx);
      const { mangueras, ...dispenserData } = dto;
      const created = await this.repository.create(dispenserData, tx);
      if (mangueras?.length) {
        for (const hose of mangueras) {
          await this.validarCombustibleManguera(hose.idCombustible, tx);
          await this.repository.addHose(created.id, hose, tx);
        }
        return this.obtenerPorId(created.id, tx);
      }
      return created;
    });
  }

  async modificar(id: number, dto: UpdateDispenserCommand, req: AuthRequest): Promise<DispenserRecord> {
    return this.transactions.mutation(req, 'dispensadores.editar', 'dispensador', async tx => {
      await this.obtenerPorId(id, tx);
      if (dto.idSucursal !== undefined) {
        await this.validarSucursalActiva(dto.idSucursal, tx);
      }
      return this.repository.update(id, dto, tx);
    });
  }

  async deshabilitar(id: number, req: AuthRequest): Promise<DispenserRecord> {
    return this.transactions.mutation(req, 'dispensadores.deshabilitar', 'dispensador', async tx => {
      await this.obtenerPorId(id, tx);
      return this.repository.disable(id, tx);
    });
  }

  async agregarManguera(dispenserId: number, dto: CreateHoseCommand, req: AuthRequest): Promise<HoseRecord> {
    return this.transactions.mutation(req, 'dispensadores.crear', 'manguera', async tx => {
      await this.obtenerPorId(dispenserId, tx);
      await this.validarCombustibleManguera(dto.idCombustible, tx);
      return this.repository.addHose(dispenserId, dto, tx);
    });
  }

  async modificarManguera(hoseId: number, dto: UpdateHoseCommand, req: AuthRequest): Promise<HoseRecord> {
    return this.transactions.mutation(req, 'dispensadores.editar', 'manguera', async tx => {
      if (dto.idCombustible !== undefined) {
        await this.validarCombustibleManguera(dto.idCombustible, tx);
      }
      return this.repository.updateHose(hoseId, dto, tx);
    });
  }

  async deshabilitarManguera(hoseId: number, req: AuthRequest): Promise<HoseRecord> {
    return this.transactions.mutation(req, 'dispensadores.deshabilitar', 'manguera', async tx => {
      return this.repository.disableHose(hoseId, tx);
    });
  }

  // Alias de retrocompatibilidad y trazabilidad con diagramas CU7
  list(query: ListQuery, req?: AuthRequest) { return this.obtener(query, req); }
  get(id: number, tx?: TransactionContext) { return this.obtenerPorId(id, tx); }
  create(dto: CreateDispenserCommand, req: AuthRequest) { return this.crear(dto, req); }
  update(id: number, dto: UpdateDispenserCommand, req: AuthRequest) { return this.modificar(id, dto, req); }
  disable(id: number, req: AuthRequest) { return this.deshabilitar(id, req); }
  saveDispenser(dto: CreateDispenserCommand, req: AuthRequest) { return this.crear(dto, req); }
  registrarManguera(dispenserId: number, dto: CreateHoseCommand, req: AuthRequest) { return this.agregarManguera(dispenserId, dto, req); }
}

export { DispenserService as ServicioDispensador };
