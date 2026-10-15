import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { BranchesService } from '../application/service';
import { CreateBranchDto, UpdateBranchDto } from './dto';
@ApiTags('Sucursales')
@ApiCookieAuth()
@Controller('sucursales')
export class BranchesController {
    constructor(private readonly service: BranchesService) { }
    @Get()
    @RequirePermissions('usuarios.gestionar', 'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'sucursales.gestionar', 'sucursales.ver')
    @ApiOperation({ summary: 'Sucursales activas para asignación opcional de usuarios.' })
    obtener() { return this.service.branches(); }
    @Get('gestion')
    @RequirePermissions('sucursales.gestionar', 'sucursales.ver')
    listar(@Query() query: ListQuery) { return this.service.obtener(query); }
    @Get(':id')
    @RequirePermissions('sucursales.gestionar', 'sucursales.ver')
    obtenerPorId(@Param('id', ParseIntPipe) id: number) { return this.service.obtenerPorId(id); }
    @Post()
    @RequirePermissions('sucursales.gestionar', 'sucursales.crear')
    crear(@Body() dto: CreateBranchDto, @Req() req: AuthRequest) { return this.service.crear(dto, req); }
    @Patch(':id')
    @RequirePermissions('sucursales.gestionar', 'sucursales.editar')
    modificar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBranchDto, @Req() req: AuthRequest) { return this.service.modificar(id, dto, req); }
    @Post(':id/deshabilitar')
    @HttpCode(200)
    @RequirePermissions('sucursales.gestionar', 'sucursales.deshabilitar')
    eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) { return this.service.eliminar(id, req); }
    @Delete(':id')
    @RequirePermissions('sucursales.gestionar', 'sucursales.deshabilitar')
    eliminarPorDelete(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) { return this.service.eliminar(id, req); }

    // Alias para retrocompatibilidad
    list() { return this.obtener(); }
    detail(id: number) { return this.obtenerPorId(id); }
    create(dto: CreateBranchDto, req: AuthRequest) { return this.crear(dto, req); }
    update(id: number, dto: UpdateBranchDto, req: AuthRequest) { return this.modificar(id, dto, req); }
    disable(id: number, req: AuthRequest) { return this.eliminar(id, req); }
    delete(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}
export { BranchesController as ControladorSucursal };

