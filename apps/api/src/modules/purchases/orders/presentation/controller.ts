import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { PurchaseOrderService } from '../application/service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './dto';

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
}

export const ControladorOrdenCompra = PurchaseOrdersController;
