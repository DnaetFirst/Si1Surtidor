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
    list(
    @Query()
    query: ListQuery) { return this.service.roles(query); }
    @Get(':id')
    @RequirePermissions('roles.gestionar', 'roles.ver', 'roles.editar')
    detail(
    @Param('id', ParseIntPipe)
    id: number) { return this.service.role(id); }
    @Post()
    @RequirePermissions('roles.gestionar', 'roles.crear')
    create(
    @Body()
    dto: RoleDto,
    @Req()
    req: AuthRequest) { return this.service.createRole(dto, req); }
    @Patch(':id')
    @RequirePermissions('roles.gestionar', 'roles.editar')
    update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    dto: UpdateRoleDto,
    @Req()
    req: AuthRequest) { return this.service.updateRole(id, dto, req); }
    @Post(':id/deshabilitar')
    @HttpCode(200)
    @RequirePermissions('roles.gestionar', 'roles.deshabilitar')
    disable(
    @Param('id', ParseIntPipe)
    id: number,
    @Req()
    req: AuthRequest) { return this.service.disableRole(id, req); }
}
