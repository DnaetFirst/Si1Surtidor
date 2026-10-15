import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { ListQuery } from '../../../../shared/domain/pagination';
import { BranchesRepository } from '../domain/repository';
import { CreateBranchCommand, UpdateBranchCommand } from '../domain/commands';
@Injectable()
export class BranchesService {
    constructor(private readonly repository: BranchesRepository, private readonly transactions: AdministrativeTransaction) { }
    branches() { return this.repository.branches(); }
    async obtener(query: ListQuery) {
        return { ...await this.repository.list(query), empresa: await this.repository.company() };
    }
    async obtenerPorId(id: number, tx?: TransactionContext) {
        const branch = await this.repository.find(id, tx);
        if (!branch) throw new NotFoundException('Sucursal no encontrada.');
        return branch;
    }
    crear(dto: CreateBranchCommand, req: AuthRequest) {
        return this.transactions.mutation(req, 'sucursales.crear', 'sucursal', async tx => {
            const company = await this.repository.company(tx);
            if (!company) throw new ConflictException('Registre la empresa antes de crear una sucursal.');
            if (await this.repository.duplicate(dto.nombre, null, tx)) throw new ConflictException('Ya existe una sucursal con ese nombre, incluso si está deshabilitada.');
            return this.repository.create(dto, company.id, tx);
        });
    }
    modificar(id: number, dto: UpdateBranchCommand, req: AuthRequest) {
        return this.transactions.mutation(req, 'sucursales.editar', 'sucursal', async tx => {
            await this.obtenerPorId(id, tx);
            if (dto.nombre !== undefined && await this.repository.duplicate(dto.nombre, id, tx)) throw new ConflictException('Ya existe una sucursal con ese nombre, incluso si está deshabilitada.');
            return this.repository.update(id, dto, tx);
        });
    }
    eliminar(id: number, req: AuthRequest) {
        return this.transactions.mutation(req, 'sucursales.deshabilitar', 'sucursal', async tx => {
            await this.obtenerPorId(id, tx);
            return this.repository.disable(id, tx);
        });
    }

    // Alias para retrocompatibilidad
    list(query: ListQuery) { return this.obtener(query); }
    get(id: number, tx?: TransactionContext) { return this.obtenerPorId(id, tx); }
    create(dto: CreateBranchCommand, req: AuthRequest) { return this.crear(dto, req); }
    update(id: number, dto: UpdateBranchCommand, req: AuthRequest) { return this.modificar(id, dto, req); }
    delete(id: number, req: AuthRequest) { return this.eliminar(id, req); }
    disable(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}
export { BranchesService as ServicioSucursal };

