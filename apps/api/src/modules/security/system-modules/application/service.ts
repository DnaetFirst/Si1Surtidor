import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { CreateSystemModuleCommand, UpdateSystemModuleCommand } from '../domain/commands';
import { SystemModuleRepository } from '../domain/repository';

@Injectable()
export class SystemModuleService {
  constructor(
    private readonly repository: SystemModuleRepository,
    private readonly transactions: AdministrativeTransaction
  ) {}

  async list(tx?: TransactionContext) {
    return this.repository.list(tx);
  }

  async get(id: number, tx?: TransactionContext) {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Módulo del sistema no encontrado.');
    return item;
  }

  async create(dto: CreateSystemModuleCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'modulos.crear', 'modulo_sistema', async tx => {
      const existing = await this.repository.findByCode(dto.codigo.trim(), tx);
      if (existing) {
        throw new ConflictException(`El módulo con código "${dto.codigo}" ya existe.`);
      }
      return this.repository.create({
        codigo: dto.codigo.trim().toLowerCase(),
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || '',
        activo: dto.activo ?? true,
      }, tx);
    });
  }

  async update(id: number, dto: UpdateSystemModuleCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'modulos.editar', 'modulo_sistema', async tx => {
      const current = await this.repository.findById(id, tx);
      if (!current) throw new NotFoundException('Módulo del sistema no encontrado.');

      if (dto.codigo && dto.codigo.trim().toLowerCase() !== current.codigo.toLowerCase()) {
        const duplicate = await this.repository.findByCode(dto.codigo.trim(), tx);
        if (duplicate) {
          throw new ConflictException(`El módulo con código "${dto.codigo}" ya existe.`);
        }
      }

      return this.repository.update(id, {
        codigo: dto.codigo?.trim().toLowerCase(),
        nombre: dto.nombre?.trim(),
        descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : undefined,
        activo: dto.activo,
      }, tx);
    });
  }

  async delete(id: number, req: AuthRequest) {
    return this.transactions.mutation(req, 'modulos.eliminar', 'modulo_sistema', async tx => {
      const current = await this.repository.findById(id, tx);
      if (!current) throw new NotFoundException('Módulo del sistema no encontrado.');

      await this.repository.delete(id, tx);
      return { id, deleted: true };
    });
  }
}
