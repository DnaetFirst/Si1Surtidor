import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { PurchaseOrderService } from '../application/service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './dto';

/**
 * CU9. Gestionar órdenes de compra (Diagramas UML: OrderController / OrdenController).
 */
@ApiTags('Órdenes de Compra')
@ApiCookieAuth()
@Controller('ordenes-compra')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Get()
  @RequirePermissions('ordenes.gestionar', 'ordenes.ver')
  @ApiOperation({ summary: 'Listar órdenes de compra.' })
  obtener(@Query() query: ListQuery, @Query('sucursalId') sucursalId?: number) {
    return this.service.obtener(query, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get(':id')
  @RequirePermissions('ordenes.gestionar', 'ordenes.ver')
  @ApiOperation({ summary: 'Obtener detalle completo de una orden de compra con sus ítems.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('ordenes.gestionar', 'ordenes.crear')
  @ApiOperation({ summary: 'Crear una nueva orden de compra.' })
  crear(@Body() dto: CreatePurchaseOrderDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('ordenes.gestionar', 'ordenes.editar')
  @ApiOperation({ summary: 'Modificar una orden de compra en estado PENDIENTE.' })
  modificar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseOrderDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Put(':id')
  @RequirePermissions('ordenes.gestionar', 'ordenes.editar')
  @ApiOperation({ summary: 'Actualizar orden de compra (alias PUT de diagrama de secuencia CU9).' })
  actualizarPut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseOrderDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Patch(':id/estado')
  @RequirePermissions('ordenes.gestionar', 'ordenes.editar')
  @ApiOperation({ summary: 'Actualizar estado de una orden de compra (Aprobar, Recibir o Anular).' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.cambiarEstado(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('ordenes.gestionar', 'ordenes.deshabilitar', 'ordenes.editar')
  @ApiOperation({ summary: 'Cancelar una orden de compra pendiente sin recepción asociada.' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminar(id, req);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU9)
  Crear(dto: CreatePurchaseOrderDto, req: AuthRequest) { return this.crear(dto, req); }
  Modificar(id: number, dto: UpdatePurchaseOrderDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  Eliminar(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  Obtener(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
  AgregarOrdenDeCompra(dto: CreatePurchaseOrderDto, req: AuthRequest) { return this.crear(dto, req); }
  ModificarOrdenDeCompra(id: number, dto: UpdatePurchaseOrderDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  EliminarOrdenDeCompra(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  MostrarOrdenesDeCompra(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
}

// Alias exactos para documentación y defensa (CU9)
export const ControladorOrdenCompra = PurchaseOrdersController;
export const OrderController = PurchaseOrdersController;
export const OrdenController = PurchaseOrdersController;
