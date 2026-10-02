import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../auth/presentation/decorators';
import { UsersService } from '../application/service';
import { CreateUserDto, UpdateUserDto } from './dto';
@ApiTags('Usuarios')
@ApiCookieAuth()
@Controller('usuarios')
export class UsersController {
    constructor(private readonly service: UsersService) { }
    @Get()
    @RequirePermissions('usuarios.gestionar', 'usuarios.ver')
    @ApiOperation({ summary: 'Lista paginada de usuarios; nunca devuelve contraseñas ni sesiones.' })
    list(
    @Query()
    query: ListQuery) { return this.service.users(query); }
    @Get(':ci')
    @RequirePermissions('usuarios.gestionar', 'usuarios.ver', 'usuarios.editar')
    detail(
    @Param('ci')
    ci: string) { return this.service.user(ci); }
    @Post()
    @RequirePermissions('usuarios.gestionar', 'usuarios.crear')
    create(
    @Body()
    dto: CreateUserDto,
    @Req()
    req: AuthRequest) { return this.service.createUser(dto, req); }
    @Patch(':ci')
    @RequirePermissions('usuarios.gestionar', 'usuarios.editar')
    update(
    @Param('ci')
    ci: string,
    @Body()
    dto: UpdateUserDto,
    @Req()
    req: AuthRequest) { return this.service.updateUser(ci, dto, req); }
    @Post(':ci/deshabilitar')
    @HttpCode(200)
    @RequirePermissions('usuarios.gestionar', 'usuarios.deshabilitar')
    @ApiOperation({ summary: 'Deshabilita el usuario y revoca sus sesiones. Protege ASU y último ATI.' })
    disable(
    @Param('ci')
    ci: string,
    @Req()
    req: AuthRequest) { return this.service.disableUser(ci, req); }
}
