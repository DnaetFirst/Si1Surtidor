import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { ProviderService } from '../application/service';
import { CreateProviderDto, LinkProductDto, UpdateProviderDto } from './dto';

/**
 * CU13. Gestionar proveedores (Diagramas UML: ProviderController / ProveedorController / SupplierController).
 */
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

  @Put(':id')
  @RequirePermissions('proveedores.gestionar', 'proveedores.editar')
  @ApiOperation({ summary: 'Actualizar proveedor (alias PUT de diagrama de secuencia CU13).' })
  actualizarPut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProviderDto, @Req() req: AuthRequest) {
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
  @ApiOperation({ summary: 'Deshabilitar proveedor conservando historial.' })
  deshabilitar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deshabilitar(id, req);
  }

  @Delete(':id')
  @RequirePermissions('proveedores.gestionar', 'proveedores.deshabilitar')
  @ApiOperation({ summary: 'Eliminar proveedor solo si no tiene operaciones relacionadas.' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminar(id, req);
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

  // Alias de métodos para trazabilidad con diagramas UML (CU13)
  Crear(dto: CreateProviderDto, req: AuthRequest) { return this.crear(dto, req); }
  Modificar(id: number, dto: UpdateProviderDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  Eliminar(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  Obtener(query: ListQuery) { return this.obtener(query); }
  Mostrar(query: ListQuery) { return this.obtener(query); }
  AgregarProveedor(dto: CreateProviderDto, req: AuthRequest) { return this.crear(dto, req); }
  ModificarProveedor(id: number, dto: UpdateProviderDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  EliminarProveedor(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  ObtenerProveedor(query: ListQuery) { return this.obtener(query); }
}

// Alias exactos para documentación y defensa (CU13)
export { ProvidersController as ControladorProveedor };
export { ProvidersController as ProviderController };
export { ProvidersController as ProveedorController };
export { ProvidersController as SupplierController };
