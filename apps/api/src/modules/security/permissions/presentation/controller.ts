import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../auth/presentation/decorators';
import { PermissionsService } from '../application/service';
import { PermissionDto, UpdatePermissionDto } from './dto';
@ApiTags('Permisos')
@ApiCookieAuth()
@Controller('permisos')
export class PermissionsController {
    constructor(private readonly service: PermissionsService) { }
    @Get('asignables')
    @RequirePermissions('roles.gestionar', 'roles.ver', 'roles.crear', 'roles.editar')
    assignable(
    @Req()
    req: AuthRequest) { return this.service.assignablePermissions(req); }
    @Get('capacidades')
    @RequirePermissions('permisos.gestionar', 'permisos.ver', 'permisos.crear')
    @ApiOperation({ summary: 'Catálogo de capacidades implementadas; la vinculación es inmutable.' })
    capabilities() { return this.service.capabilities(); }
    @Get('exportar')
    @RequirePermissions('permisos.gestionar', 'permisos.exportar')
    @ApiProduces('text/csv')
    async export(
    @Query()
    query: ListQuery,
    @Req()
    req: AuthRequest,
    @Res()
    res: Response) {
        const content = await this.service.exportPermissions(query, req);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="permisos.csv"');
        res.send(content);
    }
    @Get()
    @RequirePermissions('permisos.gestionar', 'permisos.ver')
    list(
    @Query()
    query: ListQuery) { return this.service.permissions(query); }
    @Get(':id')
    @RequirePermissions('permisos.gestionar', 'permisos.ver', 'permisos.editar')
    detail(
    @Param('id', ParseIntPipe)
    id: number) { return this.service.permission(id); }
    @Post()
    @RequirePermissions('permisos.gestionar', 'permisos.crear')
    create(
    @Body()
    dto: PermissionDto,
    @Req()
    req: AuthRequest) { return this.service.createPermission(dto, req); }
    @Patch(':id')
    @RequirePermissions('permisos.gestionar', 'permisos.editar')
    update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    dto: UpdatePermissionDto,
    @Req()
    req: AuthRequest) { return this.service.updatePermission(id, dto, req); }
    @Post(':id/deshabilitar')
    @HttpCode(200)
    @RequirePermissions('permisos.gestionar', 'permisos.deshabilitar')
    disable(
    @Param('id', ParseIntPipe)
    id: number,
    @Req()
    req: AuthRequest) { return this.service.disablePermission(id, req); }
}
