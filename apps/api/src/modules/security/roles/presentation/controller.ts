import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../auth/presentation/decorators';
import { RolesService } from '../application/service';
import { RoleDto, UpdateRoleDto } from './dto';
@ApiTags('Roles')
@ApiCookieAuth()
@Controller('roles')
export class RolesController {
    constructor(private readonly service: RolesService) { }
    @Get('opciones')
    @RequirePermissions('usuarios.gestionar', 'usuarios.crear', 'usuarios.editar', 'roles.gestionar', 'roles.ver')
    @ApiOperation({ summary: 'Roles activos asignables al usuario autenticado.' })
    options(
    @Req()
    req: AuthRequest) { return this.service.roleOptions(req); }
    @Get()
    @RequirePermissions('roles.gestionar', 'roles.ver')
    obtener(
    @Query()
    query: ListQuery) { return this.service.roles(query); }
    @Get(':id')
    @RequirePermissions('roles.gestionar', 'roles.ver', 'roles.editar')
    obtenerPorId(
    @Param('id', ParseIntPipe)
    id: number) { return this.service.role(id); }
    @Post()
    @RequirePermissions('roles.gestionar', 'roles.crear')
    crear(
    @Body()
    dto: RoleDto,
    @Req()
    req: AuthRequest) { return this.service.createRole(dto, req); }
    @Patch(':id')
    @RequirePermissions('roles.gestionar', 'roles.editar')
    modificar(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    dto: UpdateRoleDto,
    @Req()
    req: AuthRequest) { return this.service.updateRole(id, dto, req); }
    @Post(':id/deshabilitar')
    @HttpCode(200)
    @RequirePermissions('roles.gestionar', 'roles.deshabilitar')
    deshabilitar(
    @Param('id', ParseIntPipe)
    id: number,
    @Req()
    req: AuthRequest) { return this.service.disableRole(id, req); }

    // Alias para retrocompatibilidad
    list(query: ListQuery) { return this.obtener(query); }
    detail(id: number) { return this.obtenerPorId(id); }
    create(dto: RoleDto, req: AuthRequest) { return this.crear(dto, req); }
    update(id: number, dto: UpdateRoleDto, req: AuthRequest) { return this.modificar(id, dto, req); }
    disable(id: number, req: AuthRequest) { return this.deshabilitar(id, req); }
}

// Alias en español para el análisis y defensa de arquitectura
export { RolesController as ControladorRol };

