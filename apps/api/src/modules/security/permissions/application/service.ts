import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuditWriter, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { csv } from '../../../../shared/domain/csv';
import { BadRequestException, ConflictException } from '../../../../shared/domain/errors';
import { ListQuery } from '../../../../shared/domain/pagination';
import { AdministrationPolicy } from '../../domain/administration-policy';
import { CAPABILITIES } from '../domain/capabilities';
import { PermissionDto, UpdatePermissionDto } from '../domain/commands';
import { PermissionsRepository } from '../domain/repository';
@Injectable()
export class PermissionsService {
    constructor(private readonly repository: PermissionsRepository, private readonly transactions: AdministrativeTransaction, private readonly auditWriter: AuditWriter, private readonly policy: AdministrationPolicy) { }
    permissions(query: ListQuery) { return this.repository.permissions(query); }
    permission(id: number, tx?: TransactionContext) { return this.repository.permission(id, tx); }
    assignablePermissions(req: AuthRequest) { return this.repository.assignablePermissions(req); }
    capabilities() { return CAPABILITIES; }
    async createPermission(dto: PermissionDto, req: AuthRequest) {
        const capability = CAPABILITIES.find(item => item.modulo === dto.modulo && item.accion === dto.accion);
        if (!capability)
            throw new BadRequestException('La capacidad seleccionada no existe.');
        return this.transactions.mutation(req, 'permisos.crear', 'permiso', async (tx) => {
            const [permission] = await this.repository.insert(capability, dto, tx);
            return this.repository.permission(permission.id, tx);
        });
    }
    async updatePermission(id: number, dto: UpdatePermissionDto, req: AuthRequest) {
        return this.transactions.mutation(req, 'permisos.editar', 'permiso', async (tx) => {
            await this.repository.permission(id, tx);
            if (dto.nombre !== undefined)
                await this.repository.rename(dto, id, tx);
            if (dto.descripcion !== undefined)
                await this.repository.describe(dto, id, tx);
            return this.repository.permission(id, tx);
        });
    }
    async disablePermission(id: number, req: AuthRequest) {
        return this.transactions.mutation(req, 'permisos.deshabilitar', 'permiso', async (tx) => {
            await this.repository.permission(id, tx);
            const [{ existe }] = await this.repository.assignments(id, tx);
            if (existe)
                throw new ConflictException('No se puede deshabilitar un permiso asignado a roles.');
            await this.repository.disable(id, tx);
            await this.policy.assertLastATI(tx);
            return this.repository.permission(id, tx);
        });
    }
    async exportPermissions(query: ListQuery, req: AuthRequest) {
        const records = await this.repository.exportRecords(query);
        await this.auditWriter.record(req, 'permisos.exportar', 'permiso');
        return csv(['Nombre', 'Descripción', 'Capacidad', 'Estado', 'Creación UTC'], records.map((item: any) => [item.nombre, item.descripcion, item.codigo, item.activo ? 'Activo' : 'Deshabilitado', item.createdAt]));
    }
}
