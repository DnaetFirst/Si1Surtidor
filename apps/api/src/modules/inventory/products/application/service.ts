import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { BadRequestException, ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { CreateProductCommand, UpdateProductCommand } from '../domain/commands';
import { ProductRepository } from '../domain/repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly transactions: AdministrativeTransaction
  ) {}

  async list(tx?: TransactionContext) {
    return this.repository.list(tx);
  }

  async get(id: number, tx?: TransactionContext) {
    const item = await this.repository.findById(id, tx);
    if (!item) throw new NotFoundException('Producto no encontrado.');
    return item;
  }

  async create(dto: CreateProductCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'productos.crear', 'producto', async tx => {
      const existing = await this.repository.findByName(dto.nombre.trim(), tx);
      if (existing) {
        throw new ConflictException(`El producto con nombre "${dto.nombre}" ya existe.`);
      }

      const catOk = await this.repository.categoryExists(dto.idCategoria, tx);
      if (!catOk) {
        throw new BadRequestException('La categoría especificada no existe.');
      }

      if (dto.idSucursal !== undefined && dto.idSucursal !== null) {
        const sucOk = await this.repository.sucursalExists(dto.idSucursal, tx);
        if (!sucOk) {
          throw new BadRequestException('La sucursal especificada no existe.');
        }
      }

      return this.repository.create({
        nombre: dto.nombre.trim(),
        stock: dto.stock ?? 0,
        stockMinimo: dto.stockMinimo ?? 0,
        descripcion: dto.descripcion?.trim() || '',
        precioVenta: dto.precioVenta,
        precioCompra: dto.precioCompra ?? 0,
        iva: dto.iva ?? 0,
        urlImage: dto.urlImage?.trim() || '',
        estaActivo: dto.estaActivo ?? true,
        descuento: dto.descuento ?? 0,
        idCategoria: dto.idCategoria,
        idSucursal: dto.idSucursal,
        grupos: dto.grupos,
      }, tx);
    });
  }

  async update(id: number, dto: UpdateProductCommand, req: AuthRequest) {
    return this.transactions.mutation(req, 'productos.editar', 'producto', async tx => {
      const current = await this.repository.findById(id, tx);
      if (!current) throw new NotFoundException('Producto no encontrado.');

      if (dto.nombre && dto.nombre.trim().toLowerCase() !== current.nombre.toLowerCase()) {
        const duplicate = await this.repository.findByName(dto.nombre.trim(), tx);
        if (duplicate) {
          throw new ConflictException(`El producto con nombre "${dto.nombre}" ya existe.`);
        }
      }

      if (dto.idCategoria !== undefined) {
        const catOk = await this.repository.categoryExists(dto.idCategoria, tx);
        if (!catOk) {
          throw new BadRequestException('La categoría especificada no existe.');
        }
      }

      if (dto.idSucursal !== undefined && dto.idSucursal !== null) {
        const sucOk = await this.repository.sucursalExists(dto.idSucursal, tx);
        if (!sucOk) {
          throw new BadRequestException('La sucursal especificada no existe.');
        }
      }

      return this.repository.update(id, {
        nombre: dto.nombre?.trim(),
        stock: dto.stock,
        stockMinimo: dto.stockMinimo,
        descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : undefined,
        precioVenta: dto.precioVenta,
        precioCompra: dto.precioCompra,
        iva: dto.iva,
        urlImage: dto.urlImage !== undefined ? dto.urlImage.trim() : undefined,
        estaActivo: dto.estaActivo,
        descuento: dto.descuento,
        idCategoria: dto.idCategoria,
        idSucursal: dto.idSucursal,
        grupos: dto.grupos,
      }, tx);
    });
  }

  async delete(id: number, req: AuthRequest) {
    return this.transactions.mutation(req, 'productos.eliminar', 'producto', async tx => {
      const current = await this.repository.findById(id, tx);
      if (!current) throw new NotFoundException('Producto no encontrado.');

      await this.repository.delete(id, tx);
      return { id, deleted: true };
    });
  }
}
