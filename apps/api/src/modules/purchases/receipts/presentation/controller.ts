import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { PurchaseReceiptService } from '../application/service';
import { CreatePurchaseReceiptDto } from './dto';

@ApiTags('Compras / Recepciones')
@ApiCookieAuth()
@Controller('compras')
export class PurchaseReceiptsController {
  constructor(private readonly service: PurchaseReceiptService) {}

  @Get()
  @RequirePermissions('compras.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Listar notas de compra (recepciones).' })
  obtener(@Query() query: ListQuery, @Query('sucursalId') sucursalId?: number) {
    return this.service.obtener(query, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('lotes')
  @RequirePermissions('compras.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Listar lotes de inventario ingresados por compras.' })
  obtenerLotes(@Query() query: ListQuery, @Query('productoId') productoId?: number) {
    return this.service.obtenerLotes(query, productoId ? Number(productoId) : undefined);
  }

  @Get(':id')
  @RequirePermissions('compras.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Obtener detalle de una nota de compra con lotes e ítems.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('compras.gestionar', 'compras.crear')
  @ApiOperation({ summary: 'Registrar nueva compra/recepción con incremento de stock y lotes.' })
  crear(@Body() dto: CreatePurchaseReceiptDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }
}

export const ControladorNotaCompra = PurchaseReceiptsController;
