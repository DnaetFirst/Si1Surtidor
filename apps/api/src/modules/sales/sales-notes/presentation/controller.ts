import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { SaleService } from '../application/service';
import { CreateSaleDto } from './dto';

/**
 * CU11. Gestionar ventas (Diagramas UML: SalesController).
 */
@ApiTags('Ventas')
@ApiCookieAuth()
@Controller('ventas')
export class SalesController {
  constructor(private readonly service: SaleService) {}

  @Get()
  @RequirePermissions('ventas.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Listar notas de venta emitidas.' })
  obtener(@Query() query: ListQuery, @Query('sucursalId') sucursalId?: number) {
    return this.service.obtener(query, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('clientes')
  @RequirePermissions('ventas.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Listar clientes registrados en ventas.' })
  obtenerClientes(@Query() query: ListQuery) {
    return this.service.obtenerClientes(query);
  }

  @Get(':id')
  @RequirePermissions('ventas.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Obtener detalle completo de una venta con ítems y dispensador.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('ventas.gestionar', 'ventas.crear')
  @ApiOperation({ summary: 'Registrar nueva venta de combustible y/o productos de tienda con B-SISA.' })
  crear(@Body() dto: CreateSaleDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Post(':id/anular')
  @HttpCode(200)
  @RequirePermissions('ventas.gestionar', 'ventas.deshabilitar')
  @ApiOperation({ summary: 'Anular una venta confirmada mediante autorización del Gerente de Sucursal restituyendo stock.' })
  anular(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.anular(id, req);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU11)
  CrearVenta(dto: CreateSaleDto, req: AuthRequest) { return this.crear(dto, req); }
  Anular(id: number, req: AuthRequest) { return this.anular(id, req); }
  ObtenerVentas(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
  ValidarStock(dto: CreateSaleDto) { return this.service.validarStock(dto); }
  registrarVenta(dto: CreateSaleDto, req: AuthRequest) { return this.crear(dto, req); }
  anularVenta(id: number, req: AuthRequest) { return this.anular(id, req); }
  consultarVentas(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
}

export const ControladorNotaVenta = SalesController;
