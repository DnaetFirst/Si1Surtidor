import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { CreateFuelCommand, UpdateFuelCommand } from '../domain/commands';
import { FuelRepository } from '../domain/repository';

@Injectable()
export class FuelService {
  constructor(
    private readonly repository: FuelRepository,
    private readonly transactions: AdministrativeTransaction
  ) {}

  async list(tx?: TransactionContext) {
    return this.repository.list(tx);
  }

  async get(id: number, tx?: TransactionContext) {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Combustible no encontrado.');
    return item;
  }

  async create(dto: CreateFuelCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'combustibles.crear', 'combustible', async tx => {
      const existing = await this.repository.findByName(dto.nombre.trim(), tx);
      if (existing) {
        throw new ConflictException(`El combustible con nombre "${dto.nombre}" ya existe.`);
      }
      return this.repository.create({
        tipo: dto.tipo.trim().toLowerCase(),
        octanaje: dto.octanaje,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || '',
        estaActivo: dto.estaActivo ?? true,
      }, tx);
    });
  }

  async update(id: number, dto: UpdateFuelCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'combustibles.editar', 'combustible', async tx => {
      const current = await this.repository.findById(id, tx);
      if (!current) throw new NotFoundException('Combustible no encontrado.');

      if (dto.nombre && dto.nombre.trim().toLowerCase() !== current.nombre.toLowerCase()) {
        const duplicate = await this.repository.findByName(dto.nombre.trim(), tx);
        if (duplicate) {
          throw new ConflictException(`El combustible con nombre "${dto.nombre}" ya existe.`);
        }
      }

      return this.repository.update(id, {
        tipo: dto.tipo ? dto.tipo.trim().toLowerCase() : undefined,
        octanaje: dto.octanaje,
        nombre: dto.nombre?.trim(),
        descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : undefined,
        estaActivo: dto.estaActivo,
      }, tx);
    });
  }

  async delete(id: number, req: AuthRequest) {
    return this.transactions.mutation(req, 'combustibles.eliminar', 'combustible', async tx => {
      const current = await this.repository.findById(id, tx);
      if (!current) throw new NotFoundException('Combustible no encontrado.');

      await this.repository.delete(id, tx);
      return { id, deleted: true };
    });
  }
}
