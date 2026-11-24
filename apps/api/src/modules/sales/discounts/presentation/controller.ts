import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { DiscountService } from '../application/service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto';

/**
 * CU12. Gestionar descuentos (Diagrama de Comunicación / Análisis / Secuencia: DiscountController / DescuentoController).
 */
@ApiTags('Descuentos')
@ApiCookieAuth()
@Controller('descuentos')
export class DiscountsController {
  constructor(private readonly service: DiscountService) {}

  @Get()
  @RequirePermissions('descuentos.gestionar', 'descuentos.ver')
  @ApiOperation({ summary: 'Listar descuentos parametrizados.' })
  obtener(@Query() query: ListQuery, @Query('sucursalId') sucursalId?: number) {
    return this.service.obtener(query, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('activos')
  @RequirePermissions('descuentos.gestionar', 'descuentos.ver', 'ventas.crear')
  @ApiOperation({ summary: 'Listar descuentos activos aplicables a una venta.' })
  obtenerActivos(@Query('sucursalId') sucursalId?: number) {
    return this.service.obtenerActivos(sucursalId ? Number(sucursalId) : undefined);
  }

  @Get(':id')
  @RequirePermissions('descuentos.gestionar', 'descuentos.ver')
  @ApiOperation({ summary: 'Obtener un descuento por ID.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('descuentos.gestionar', 'descuentos.crear')
  @ApiOperation({ summary: 'Crear un nuevo descuento.' })
  crear(@Body() dto: CreateDiscountDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('descuentos.gestionar', 'descuentos.editar')
  @ApiOperation({ summary: 'Modificar datos del descuento.' })
  modificar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiscountDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Put(':id')
  @RequirePermissions('descuentos.gestionar', 'descuentos.editar')
  @ApiOperation({ summary: 'Actualizar descuento (alias PUT de diagrama de secuencia CU12).' })
  actualizarPut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiscountDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Patch(':id/estado')
  @RequirePermissions('descuentos.gestionar', 'descuentos.editar', 'descuentos.deshabilitar')
  @ApiOperation({ summary: 'Activar o desactivar descuento.' })
  alternarEstado(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.alternarEstado(id, req);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('descuentos.gestionar', 'descuentos.deshabilitar', 'descuentos.eliminar')
  @ApiOperation({ summary: 'Eliminar descuento.' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminar(id, req);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU12)
  Crear(dto: CreateDiscountDto, req: AuthRequest) { return this.crear(dto, req); }
  Modificar(id: number, dto: UpdateDiscountDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  Eliminar(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  Obtener(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
  AgregarDescuento(dto: CreateDiscountDto, req: AuthRequest) { return this.crear(dto, req); }
  ModificarDescuento(id: number, dto: UpdateDiscountDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  EliminarDescuento(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  ObtenerDescuento(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
}

// Alias exactos para documentación y defensa (CU12)
export const ControladorDescuento = DiscountsController;
export const DiscountController = DiscountsController;
export const DescuentoController = DiscountsController;
