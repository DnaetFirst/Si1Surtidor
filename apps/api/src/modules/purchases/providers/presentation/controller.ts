import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { ProviderService } from '../application/service';
import { CreateProviderDto, LinkProductDto, UpdateProviderDto } from './dto';

@ApiTags('Proveedores')
@ApiCookieAuth()
@Controller('proveedores')
export class ProvidersController {
  constructor(private readonly service: ProviderService) {}

  @Get()
  @RequirePermissions('proveedores.gestionar', 'proveedores.ver')
  @ApiOperation({ summary: 'Listar proveedores con paginación y búsqueda.' })
  obtener(@Query() query: ListQuery) {
    return this.service.obtener(query);
  }

  @Get(':id')
  @RequirePermissions('proveedores.gestionar', 'proveedores.ver')
  @ApiOperation({ summary: 'Obtener detalle de proveedor con sus productos asociados.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('proveedores.gestionar', 'proveedores.crear')
  @ApiOperation({ summary: 'Registrar nuevo proveedor.' })
  crear(@Body() dto: CreateProviderDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('proveedores.gestionar', 'proveedores.editar')
  @ApiOperation({ summary: 'Modificar datos del proveedor.' })
  modificar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProviderDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Patch(':id/estado')
  @RequirePermissions('proveedores.gestionar', 'proveedores.editar')
  @ApiOperation({ summary: 'Alternar estado activo/inactivo del proveedor.' })
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.cambiarEstado(id, req);
  }

  @Post(':id/deshabilitar')
  @HttpCode(200)
  @RequirePermissions('proveedores.gestionar', 'proveedores.deshabilitar')
  @ApiOperation({ summary: 'Deshabilitar proveedor.' })
  deshabilitar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deshabilitar(id, req);
  }

  @Delete(':id')
  @RequirePermissions('proveedores.gestionar', 'proveedores.deshabilitar')
  @ApiOperation({ summary: 'Deshabilitar proveedor mediante DELETE.' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deshabilitar(id, req);
  }

  @Post(':id/productos')
  @RequirePermissions('proveedores.gestionar', 'proveedores.editar')
  @ApiOperation({ summary: 'Vincular producto con precio pactado a un proveedor.' })
  vincularProducto(@Param('id', ParseIntPipe) id: number, @Body() dto: LinkProductDto, @Req() req: AuthRequest) {
    return this.service.vincularProducto(id, dto, req);
  }

  @Get(':id/productos')
  @RequirePermissions('proveedores.gestionar', 'proveedores.ver')
  @ApiOperation({ summary: 'Listar productos asociados al proveedor.' })
  async listarProductos(@Param('id', ParseIntPipe) id: number) {
    const prov = await this.service.obtenerPorId(id);
    return prov.productos || [];
  }

  @Delete(':id/productos/:productoId')
  @RequirePermissions('proveedores.gestionar', 'proveedores.editar')
  @ApiOperation({ summary: 'Desvincular producto de un proveedor.' })
  desvincularProducto(
    @Param('id', ParseIntPipe) id: number,
    @Param('productoId', ParseIntPipe) productoId: number,
    @Req() req: AuthRequest,
  ) {
    return this.service.desvincularProducto(id, productoId, req);
  }
}

export { ProvidersController as ControladorProveedor };
