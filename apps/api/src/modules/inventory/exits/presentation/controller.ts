import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { ProductExitService } from '../application/service';
import { CreateProductExitDto } from './dto';

/**
 * CU19. Gestionar salidas de productos (Diagramas UML: OutputController / ControlSalida).
 */
@ApiTags('Inventario - Salidas de Productos')
@ApiCookieAuth()
@Controller('inventario/salidas')
export class ProductExitsController {
  constructor(private readonly service: ProductExitService) {}

  @Get()
  @RequirePermissions('salidas.gestionar', 'salidas.ver')
  @ApiOperation({ summary: 'Listar salidas registradas de inventario.' })
  obtener(@Query() query: ListQuery, @Query('sucursalId') sucursalId?: number) {
    return this.service.obtener(query, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get(':id')
  @RequirePermissions('salidas.gestionar', 'salidas.ver')
  @ApiOperation({ summary: 'Obtener detalle de una salida de producto.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('salidas.gestionar', 'salidas.crear')
  @ApiOperation({ summary: 'Registrar nueva salida o baja de producto del inventario.' })
  crear(@Body() dto: CreateProductExitDto, @Req() req: AuthRequest) {
    return this.service.registrarSalida(dto, req);
  }

  @Post(':id/revertir')
  @HttpCode(200)
  @RequirePermissions('salidas.gestionar', 'salidas.deshabilitar')
  @ApiOperation({ summary: 'Anular salida confirmada mediante movimiento inverso autorizado.' })
  revertirSalida(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.revertirSalida(id, req);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU19)
  Crear(dto: CreateProductExitDto, req: AuthRequest) { return this.crear(dto, req); }
  Obtener(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
  Mostrar(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
  registrarSalida(dto: CreateProductExitDto, req: AuthRequest) { return this.crear(dto, req); }
}

// Alias exactos para documentación y defensa (CU19)
export const ControladorSalidaProducto = ProductExitsController;
export const OutputController = ProductExitsController;
export const ControlSalida = ProductExitsController;
