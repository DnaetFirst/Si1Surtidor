import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { CreateCategoryCommand, CreateGroupCommand, UpdateCategoryCommand, UpdateGroupCommand } from '../domain/commands';
import { CategoryGroupRepository } from '../domain/repository';

@Injectable()
export class CategoryGroupService {
  constructor(
    private readonly repository: CategoryGroupRepository,
    private readonly transactions: AdministrativeTransaction
  ) {}

  async obtenerCategorias(tx?: TransactionContext) {
    return this.repository.listCategories(tx);
  }

  async listCategories(tx?: TransactionContext) {
    return this.obtenerCategorias(tx);
  }

  async obtenerCategoriaPorId(id: number, tx?: TransactionContext) {
    const item = await this.repository.findCategoryById(id, tx);
    if (!item) throw new NotFoundException('Categoría no encontrada.');
    return item;
  }

  async getCategory(id: number, tx?: TransactionContext) {
    return this.obtenerCategoriaPorId(id, tx);
  }

  async crearCategoria(dto: CreateCategoryCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'categorias.crear', 'categoria', async tx => {
      const existing = await this.repository.findCategoryByName(dto.nombre.trim(), tx);
      if (existing) {
        throw new ConflictException(`La categoría con nombre "${dto.nombre}" ya existe.`);
      }
      return this.repository.createCategory({
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || '',
        imagenUrl: dto.imagenUrl?.trim() || '',
        activo: dto.activo ?? true,
      }, tx);
    });
  }

  async createCategory(dto: CreateCategoryCommand, req: AuthRequest) {
    return this.crearCategoria(dto, req);
  }

  async modificarCategoria(id: number, dto: UpdateCategoryCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'categorias.editar', 'categoria', async tx => {
      const current = await this.repository.findCategoryById(id, tx);
      if (!current) throw new NotFoundException('Categoría no encontrada.');

      if (dto.nombre && dto.nombre.trim().toLowerCase() !== current.nombre.toLowerCase()) {
        const duplicate = await this.repository.findCategoryByName(dto.nombre.trim(), tx);
        if (duplicate) {
          throw new ConflictException(`La categoría con nombre "${dto.nombre}" ya existe.`);
        }
      }

      return this.repository.updateCategory(id, {
        nombre: dto.nombre?.trim(),
        descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : undefined,
        imagenUrl: dto.imagenUrl !== undefined ? dto.imagenUrl.trim() : undefined,
        activo: dto.activo,
      }, tx);
    });
  }

  async updateCategory(id: number, dto: UpdateCategoryCommand, req: AuthRequest) {
    return this.modificarCategoria(id, dto, req);
  }

  async eliminarCategoria(id: number, req: AuthRequest) {
    return this.transactions.mutation(req, 'categorias.eliminar', 'categoria', async tx => {
      const current = await this.repository.findCategoryById(id, tx);
      if (!current) throw new NotFoundException('Categoría no encontrada.');

      const productCount = await this.repository.countProductsInCategory(id, tx);
      if (productCount > 0) {
        throw new ConflictException('No se puede eliminar la categoría porque tiene productos asignados.');
      }

      await this.repository.deleteCategory(id, tx);
      return { id, deleted: true };
    });
  }

  async deleteCategory(id: number, req: AuthRequest) {
    return this.eliminarCategoria(id, req);
  }

  async obtenerGrupos(tx?: TransactionContext) {
    return this.repository.listGroups(tx);
  }

  async listGroups(tx?: TransactionContext) {
    return this.obtenerGrupos(tx);
  }

  async obtenerGrupoPorId(id: number, tx?: TransactionContext) {
    const item = await this.repository.findGroupById(id, tx);
    if (!item) throw new NotFoundException('Grupo no encontrado.');
    return item;
  }

  async getGroup(id: number, tx?: TransactionContext) {
    return this.obtenerGrupoPorId(id, tx);
  }

  async crearGrupo(dto: CreateGroupCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'grupos.crear', 'grupo', async tx => {
      const existing = await this.repository.findGroupByName(dto.nombre.trim(), tx);
      if (existing) {
        throw new ConflictException(`El grupo con nombre "${dto.nombre}" ya existe.`);
      }
      return this.repository.createGroup({
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || '',
        activo: dto.activo ?? true,
      }, tx);
    });
  }

  async createGroup(dto: CreateGroupCommand, req: AuthRequest) {
    return this.crearGrupo(dto, req);
  }

  async modificarGrupo(id: number, dto: UpdateGroupCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'grupos.editar', 'grupo', async tx => {
      const current = await this.repository.findGroupById(id, tx);
      if (!current) throw new NotFoundException('Grupo no encontrado.');

      if (dto.nombre && dto.nombre.trim().toLowerCase() !== current.nombre.toLowerCase()) {
        const duplicate = await this.repository.findGroupByName(dto.nombre.trim(), tx);
        if (duplicate) {
          throw new ConflictException(`El grupo con nombre "${dto.nombre}" ya existe.`);
        }
      }

      return this.repository.updateGroup(id, {
        nombre: dto.nombre?.trim(),
        descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : undefined,
        activo: dto.activo,
      }, tx);
    });
  }

  async updateGroup(id: number, dto: UpdateGroupCommand, req: AuthRequest) {
    return this.modificarGrupo(id, dto, req);
  }

  async eliminarGrupo(id: number, req: AuthRequest) {
    return this.transactions.mutation(req, 'grupos.eliminar', 'grupo', async tx => {
      const current = await this.repository.findGroupById(id, tx);
      if (!current) throw new NotFoundException('Grupo no encontrado.');

      const productCount = await this.repository.countProductsInGroup(id, tx);
      if (productCount > 0) {
        throw new ConflictException('No se puede eliminar el grupo porque tiene productos asignados.');
      }

      await this.repository.deleteGroup(id, tx);
      return { id, deleted: true };
    });
  }

  async deleteGroup(id: number, req: AuthRequest) {
    return this.eliminarGrupo(id, req);
  }
}

// Alias en español para el análisis y defensa de arquitectura
export { CategoryGroupService as ServicioCategoriaGrupo };

